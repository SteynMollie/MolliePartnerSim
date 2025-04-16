import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Import and configure CORS middelware
// Allows requests from any origin
import * as cors from "cors";
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

export const helloWorld = onRequest((request, response) => {
  logger.info("generating welcome message", {structuredData: true});
  response.send("Hello user! Welcome to the Mollie Partner Simulator.");
});


