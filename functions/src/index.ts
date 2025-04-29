import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as cors from "cors";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";


if (!getApps().length) {
  initializeApp();
}


const db = getFirestore();
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

interface SaveTokenRequestBody {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  issuedAt?: number;
  scopes?: string[];
}

export const saveMollieTokens = onRequest(
  {cors: true, region: "us-central1"},
  async (request, response) => {
    corsHandler(request, response, async () => {
      if (request.method !== "POST") {
        logger.warn("Received non-POST request", {method: request.method});
        response.status(405).send({
          success: false, message: "Method Not Allowed"});
        return;
      }

      try {
        const data = request.body as SaveTokenRequestBody;

        if (!data.userId || !data.accessToken) {
          logger.warn("Missing userId or accessToken", {body: request.body});
          response.status(400).send({success: false,
            message: "userId and accessToken required"});
          return;
        }

        logger.info("Saving Mollie tokens for user:", data.userId);

        const docRef = db.collection("mollieTokens").doc(data.userId);

        interface SaveData {
          accessToken: string;
          refreshToken?: string | null;
          scopes: string[];
          issuedAt?: number | null;
          expiresAt?: number | null;
          updatedAt: string;
        }

        const saveData: SaveData = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          scopes: data.scopes ?? [],
          issuedAt: data.issuedAt ?? null,
          expiresAt: data.expiresAt ?? null,
          updatedAt: new Date().toISOString(),
        };

        Object.keys(saveData).forEach((key) => {
          const typedKey = key as keyof SaveData;
          if (saveData[typedKey] == null) {
            delete saveData[typedKey];
          }
        });

        await docRef.set(saveData, {merge: true});

        logger.info("Tokens saved successfully for user:", data.userId);
        response.status(200).send({success: true,
          message: "Tokens saved successfully"});
      } catch (error) {
        logger.error("Error saving tokens:", error);
        response.status(500).send({
          success: false, message: "Internal Server Error"});
      }
    });
  }
);


