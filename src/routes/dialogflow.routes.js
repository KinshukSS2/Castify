import { Router } from "express";
import { detectIntent, healthCheck } from "../controllers/dialogflow.controller.js";

const router = Router();


router.route("/detect-intent").post(detectIntent);
router.route("/health").get(healthCheck);

export default router;
