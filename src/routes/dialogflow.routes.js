import { Router } from "express";
import { detectIntent, healthCheck } from "../controllers/dialogflow.controller.js";

const router = Router();

// Route for detecting intent from user messages
router.route("/detect-intent").post(detectIntent);

// Health check route
router.route("/health").get(healthCheck);

export default router;
