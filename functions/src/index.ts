import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as cors from "cors";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const corsHandler = cors.default({origin: true});

const HARDCODED_USERS = [
  {
    userId: "user1",
    email: "steyn.janus@mollie.com",
    password: "password", // risky but luckily it is all fake
    name: "Steyn",
  },
  {
    userId: "user2",
    email: "jurjen.terpstra@mollie.com",
    password: "password", // risky but luckily it is all fake
    name: "Jurjen",
  },
];

export const checkLogin = onRequest({cors: true}, (request, response) => {
  corsHandler(request, response, () => {
    if (request.method !== "POST") {
      logger.warn("Received non-POST request", {method: request.method});
      response.status(405).send({success: false,
        message: "Method Not Allowed"});
      return;
    }

    const {email, password} = request.body;

    if (!email || !password) {
      logger.warn("Missing email or password", {body: request.body});
      response.status(400).send({success: false,
        message: "Email and password required"});
      return;
    }

    // Find the user by email in our hardcoded list
    const foundUser = HARDCODED_USERS.find((user) => user.email === email);

    // Check if user was found AND password matches
    if (foundUser && foundUser.password === password) {
      logger.info("Login successful for:", email);
      // Send back success and some user data (excluding password!)
      response.status(200).send({
        success: true,
        userData: {
          userId: foundUser.userId,
          name: foundUser.name,
          email: foundUser.email, // Send email back too if useful
          // Add other non-sensitive data here if needed
        },
      });
    } else {
      logger.warn("Invalid login attempt for:", email);
      response.status(401).send({success: false,
        message: "Invalid credentials"});
    }
  });
});

export const handleMollieOAuthCallback = onRequest(
  {cors: true}, async (request, response) => {
    corsHandler(request, response, async () => {
      logger.info("Mollie OAuth callback received", {query: request.query});

      const code = request.query.code as string | undefined;
      const state = request.query.state as string | undefined;

      // normally you would check the state here to prevent CSRF attacks
      if (!state) {
        logger.warn("State parameter is missing in the request");
      } else {
        logger.info("State parameter is present", {state});
      }
      const userId = state || "unknown_user";
      logger.warn("Using state as userId", {userId});

      if (!code) {
        logger.error("Authorisation code missing from Mollie callback");
        response.status(400).send("Authorisation code missing");
        return;
      }

      const clientId = functions.config().mollie.client_id;
      const clientSecret = functions.config().mollie.client_secret;
      const redirectUri =
    `https://us-central1-${process.env.GCLOUD_PROJECT || "molliepartnersim"}
    // .cloudfunctions.net/handleMollieOAuthCallback`;

      if (!clientId || !clientSecret) {
        logger.error(
          "Mollie client ID or secret not set in environment variables");
        response.status(500).send("Mollie client ID or secret not set");
        return;
      }

      try {
        logger.info("Exchanging code for access token");
        const tokenUrl = "https://api.mollie.com/oauth2/tokens";
        const params = new URLSearchParams();
        params.append("client_id", clientId);
        params.append("client_secret", clientSecret);
        params.append("code", code);
        params.append("grant_type", "authorization_code");
        params.append("redirect_uri", redirectUri);

        const tokenResponse = await fetch(tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
        });

        if (!tokenResponse.ok) {
          const errorBody = await tokenResponse.text();
          logger.error(
            "Error exchanging code for access token",
            {status: tokenResponse.status, errorBody});
          throw new Error(`Error exchanging code for access token:
           ${tokenResponse.status} ${errorBody}`);
        }

        const tokenData = await tokenResponse.json();
        logger.info("Access token received", {scopes: tokenData.scope});

        if (!tokenData.access_token) {
          throw new Error("Access token not found in Mollie's response");
        }

        const connectionData = {
          userId: userId,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          scope: tokenData.scope,
          connectedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (userId === "unknown_user") {
          throw new Error("User ID is undefined or invalid");
        }
        await db.collection(
          "mollie_connections"
        ).doc(userId).set(connectionData, {merge: true});
        logger.info("Connection data saved to Firestore", {userId});

        response.status(200).send(`
        <html><body>
          <h1>Mollie Connection Successful!</h1>
          <p>Your account is connected. 
          You can now close this window or tab.</p>
        </body></html>
      `);
      } catch (error: unknown) {
        logger.error("Error during Mollie OAuth callback:", error);
        // Send a user-friendly error message page
        const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
        response.status(500).send(`
        <html><body>
          <h1>Mollie Connection Failed</h1>
          <p>Something went wrong while connecting your Mollie account. 
          Please try again later.</p>
          <p><small>Error: ${errorMessage}</small></p>
        </body></html>
      `);
      }
    }); // End CORS Handler
  }); // End onRequest

