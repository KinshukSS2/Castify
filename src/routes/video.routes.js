import { Router } from "express";
import { getAllVideos, getvideoById, publishVideo, getMyVideos, publishVideoFromUrl, voteOnVideo, deleteVideo } from "../controllers/2video.controller.js";
import { verifyJWT, optionalJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes with optional authentication for user vote states
router.get("/getAll-videos", optionalJWT, getAllVideos);

// Protected routes (authentication required)
router.get("/getMyVideos", verifyJWT, getMyVideos);

// Public parameterized routes (must come after specific routes)
router.get("/:id", getvideoById);
router.post(
  "/publish",
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  verifyJWT,
  publishVideo
);

// New URL-based endpoint for populator
router.post("/publish-url", verifyJWT, publishVideoFromUrl);

// Voting endpoint (requires authentication to track users)
router.post("/:videoId/vote", verifyJWT, voteOnVideo);

// Delete endpoint for regular videos (requires authentication for ownership check)
router.delete("/:videoId", verifyJWT, deleteVideo);

export default router;
