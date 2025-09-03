import express from "express";
import { 
  createStory,
  getStory,
  addBranchToVideo,
  voteOnVideo,
  listStories,
  getFullStoryTree,
  deleteStory,
  deleteVideo
} from "../controllers/story.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post("/create", verifyJWT, createStory);       
router.get("/", listStories);                        
router.get("/:storyId", getStory);
router.get("/:storyId/full", getFullStoryTree);
router.delete("/:storyId", verifyJWT, deleteStory);  //not tested

router.post("/:videoId/branch", verifyJWT, addBranchToVideo);
router.post("/:videoId/vote", verifyJWT, voteOnVideo);
router.delete("/video/:videoId", verifyJWT, deleteVideo);  //not tested

export default router;
