import express from "express";
import { 
  createStory,
  getStory,
  addBranchToVideo,
  voteOnVideo,
  listStories,
  getFullStoryTree,
  deleteStory,
  deleteVideo,
  likeStory,
  saveStory,
  shareStory,
  getUserLikedStories,
  getUserSavedStories,
  updateStory
} from "../controllers/story.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post("/create", verifyJWT, createStory);       
router.get("/", listStories);                        
router.get("/liked", verifyJWT, getUserLikedStories);
router.get("/saved", verifyJWT, getUserSavedStories);
router.get("/:storyId", getStory);
router.get("/:storyId/full", getFullStoryTree);
router.put("/:storyId", verifyJWT, updateStory);
router.delete("/:storyId", verifyJWT, deleteStory);  

// Story interactions
router.post("/:storyId/like", verifyJWT, likeStory);
router.post("/:storyId/save", verifyJWT, saveStory);
router.post("/:storyId/share", shareStory);

router.post("/:videoId/branch", verifyJWT, addBranchToVideo);
router.post("/:videoId/vote", verifyJWT, voteOnVideo);
router.delete("/video/:videoId", verifyJWT, deleteVideo);  

export default router;
