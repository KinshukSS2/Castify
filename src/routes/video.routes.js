import { Router } from "express";
import { getAllVideos, getvideoById, publishVideo, getMyVideos, publishVideoFromUrl, voteOnVideo, deleteVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes (no authentication required)
router.get("/getAll-videos", getAllVideos);

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

// Voting endpoint (public access for demo purposes)
router.post("/:videoId/vote", voteOnVideo);

// Delete endpoint for regular videos (requires authentication for ownership check)
router.delete("/:videoId", verifyJWT, deleteVideo);

export default router;
