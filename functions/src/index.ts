import {onRequest} from "firebase-functions/v2/https";
import {defineString, defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as cors from "cors";
import * as admin from "firebase-admin";
import * as crypto from "crypto";


admin.initializeApp();

const db = admin.firestore();
const corsHandler = cors.default({origin: true});

const mollieClientId = defineString("MOLLIE_CLIENTID");
const mollieClientSecret = defineSecret("MOLLIE_CLIENTSECRET");

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

      const mollieError = request.query.error as string | undefined;
      if (mollieError) {
        const errorDesc = request.query.error_description as string | undefined;
        logger.error(
          "Mollie returned an error during OAuth flow",
          {error: mollieError, description: errorDesc});
        response.status(400).send(`
          <html><body>
            <h1>Mollie Connection Denied or Failed</h1>
            <p>It looks like the connection request was denied or an error.</p>
            <p><small>Error: ${
  mollieError}${
  errorDesc ? ` - ${
    errorDesc}` : ""}</small></p>
            <p>You can close this window and try again.</p>
          </body></html>
        `);
        return; // Stop execution
      }
      // --- End Error Check ---

      const receivedState = state; // Use state directly as receivedState
      const userId = receivedState;
      logger.warn(
        `Using received state directly as userId (INSECURE): ${
          userId}`);
      // --- End State Handling ---

      // Check for code *after* checking for Mollie error
      if (!code) {
        logger.error(
          "Authorization code missing from Mollie callback, no error");
        // Added more context to the message
        response.status(
          400).send(
          "Authorization code missing or invalid request.");
        return;
      }


      const clientId = mollieClientId.value();
      const clientSecret = mollieClientSecret.value();
      const projectId = process.env.GCLOUD_PROJECT || "molliepartnersim";

      // Construct the redirect URI using the projectId variable
      const redirectUri =
        `https://us-central1-${projectId}.cloudfunctions.net/handleMollieOAuthCallback`;


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

        await db.collection(
          "mollie_connections"
        ).doc(userId || "unknown_user").set(connectionData, {merge: true});
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

export const getMollieOAuthUrl = onRequest(
  {cors: true}, async (request, response) => {
    logger.info("request received for mollie oauth URL");

    const userId = request.body.userId as string | undefined;
    if (!userId) {
      logger.warn("USER ID MISSING IN REQUEST BODY");
      response.status(400).send("User ID is required");
      return;
    }

    const userExists = HARDCODED_USERS.some((u) => u.userId === userId);
    if (!userExists) {
      logger.warn("USER ID NOT FOUND IN HARDCODED USERS", userId);
      response.status(400).send("User ID not found");
      return;
    }
    logger.info("Generating OAuth URL for USER", {userId} );

    const clientId = mollieClientId.value();
    if (!clientId) {
      logger.error("Mollie client ID not set in environment variables");
      response.status(500).send("Mollie client ID not set");
      return;
    }
    const projectId = process.env.GCLOUD_PROJECT || "molliepartnersim";

    // Construct the redirect URI using the projectId variable
    const redirectUri =
        `https://us-central1-${projectId}.cloudfunctions.net/handleMollieOAuthCallback`;

    const scopes = [
      "payments.read",
      "payments.write",
      "refunds.read",
      "refunds.write",
      "customers.read",
      "customers.write",
      "mandates.read",
      "mandates.write",
      "subscriptions.read",
      "subscriptions.write",
      "profiles.read",
      "profiles.write",
      "invoices.read",
      "settlements.read",
      "orders.read",
      "orders.write",
      "shipments.read",
      "shipments.write",
      "organizations.read",
      "organizations.write",
      "onboarding.read",
      "onboarding.write",
      "shipments.read",
      "shipments.write",
      "organizations.read",
      "organizations.write",
      "onboarding.read",
      "onboarding.write",
      "payment-links.read",
      "payment-links.write",
      "balances.read",
      "terminals.read",
      "terminals.write",
      "external-accounts.read",
      "external-accounts.write",
      "persons.read",
      "persons.write",
    ];

    const state = crypto.randomBytes(16).toString("hex");

    const oauthStatesCollection = db.collection("oauth_states");
    const stateData = {
      userId: userId,
      state: state,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await oauthStatesCollection.doc(state).set(stateData);
      logger.info("Stored OAuth state in Firestore.", {
        userId: userId,
        state: state, // Provide state for context if helpful
      });
    } catch (error) {
      logger.error("Failed to store OAuth state.", {
        userId: userId,
        stateAttempted: state, // Good to know which state failed
        errorDetails: error, // Pass the caught error object here
      });
      response.status(500).send({
        success: false,
        message: "Internal error storing state.", // Message on its own line
      });
    }

    const oauthUrl = new URL("https://my.mollie.com/oauth2/authorize");
    oauthUrl.searchParams.append("client_id", clientId);
    oauthUrl.searchParams.append("redirect_uri", redirectUri);
    oauthUrl.searchParams.append("scope", scopes.join(" "));
    oauthUrl.searchParams.append("state", state);
    oauthUrl.searchParams.append("response_type", "code");

    logger.info("Generated Mollie OAuth URL for user",
      {userId, oauthUrl: oauthUrl.toString()});
    response.status(200).send({
      success: true,
      authorizeUrl: oauthUrl.toString(),
    });
  }
); // End onRequest

export const getMollieConnectionStatus = onRequest(
  {cors: true}, (request, response) => {
    corsHandler(request, response, async () => {
      const userId = request.body.userId as string | undefined;
      if (!userId) {
        logger.warn("USER ID MISSING IN REQUEST BODY");
        response.status(400).send("User ID is required");
        return;
      }

      logger.info("Checking connection status for user", {userId});

      try {
        const docRef = db.collection("mollie_connections").doc(userId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          logger.info(`User ${userId} is connected to Mollie`);
          response.status(200).send({isConnected: true});
        } else {
          logger.info(`User ${userId} is NOT connected to Mollie`);
          response.status(200).send({isConnected: false});
        }
      } catch (error) {
        logger.error("Error checking connection status", {error});
        response.status(500).send({
          isConnected: false,
          message: "Error checking connection status"}
        );
      }
    });
  }); // End onRequest


