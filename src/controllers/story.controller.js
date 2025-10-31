import { asyncHandler } from "../utils/asyncHandler.js";
import { APIerror } from "../utils/APIerror.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Story } from "../models/story.model.js";
import { APIresponse } from "../utils/APIresponse.js";
import mongoose from "mongoose";

const createStory = asyncHandler(async (req, res) => {
  const { title, description, rootVideoId } = req.body;

  if (!title || !description || !rootVideoId) {
    throw new APIerror(400, "title, description and rootVideo are required to create a story");
  }

  const rootVideo = await Video.findById(rootVideoId);
  if (!rootVideo) {
    throw new APIerror(404, "root video not found");
  }

  const story = await Story.create({
    title,
    description,
    rootVideo: rootVideoId,
    createdBy: req.user._id,
  });

  rootVideo.story = story._id;
  await rootVideo.save();

  return res.status(200).json(
    new APIresponse(200, { story }, "story created successfully")
  );
});


const getStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;
  const story = await Story.findById(storyId).populate({
    path: "rootVideo",
    select: "title description videoFile thumbnail duration votes",
    populate: { path: "branches", select: "title thumbnail videoFile" },
  });

  if (!story) {
    throw new APIerror(404, "story not found");
  }

  return res.status(200).json(
    new APIresponse(200, { story }, "story fetched successfully")
  );
});



const addBranchToVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { branchVideoId } = req.body;

  console.log("=== ADD BRANCH REQUEST ===");
  console.log("Body:", req.body);
  console.log("VideoId from params:", videoId);

  if (!branchVideoId) {
    throw new APIerror(400, "branchVideoId is required");
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new APIerror(400, "Invalid parent video ID format");
  }
  if (!mongoose.Types.ObjectId.isValid(branchVideoId)) {
    throw new APIerror(400, "Invalid branch video ID format");
  }

  try {
    // 1. Validate parent video
    console.log("Searching for parent video...");
    const parentVideo = await Video.findById(videoId);
    if (!parentVideo) {
      console.log("Parent video not found for ID:", videoId);
      throw new APIerror(404, "Parent video not found");
    }

    console.log("Parent video found:", {
      id: parentVideo._id.toString(),
      title: parentVideo.title,
      branches: parentVideo.branches || [],
      branchesLength: (parentVideo.branches || []).length
    });

    // 2. Validate branch video exists
    console.log("Searching for branch video...");
    const branchVideo = await Video.findById(branchVideoId);
    if (!branchVideo) {
      console.log("Branch video not found for ID:", branchVideoId);
      throw new APIerror(404, "Branch video not found");
    }

    console.log("Branch video found:", {
      id: branchVideo._id.toString(),
      title: branchVideo.title
    });

    // 3. Initialize branches array if it doesn't exist
    if (!parentVideo.branches) {
      console.log("Initializing branches array");
      parentVideo.branches = [];
    }

    // 4. Check if branch is already added
    const branchExists = parentVideo.branches.some(branch => branch.toString() === branchVideoId);
    if (branchExists) {
      throw new APIerror(400, "This video is already a branch of the parent video");
    }

    // 5. Add branch reference to parent and set parent reference in branch
    console.log("Adding branch to parent...");
    parentVideo.branches.push(branchVideoId);
    branchVideo.parentVideo = videoId;
    
    console.log("Saving parent video with branches:", parentVideo.branches.map(b => b.toString()));
    await parentVideo.save();
    
    console.log("Saving branch video with parent:", branchVideo.parentVideo);
    await branchVideo.save();

    console.log("=== BRANCH ADDED SUCCESSFULLY ===");
    return res.status(200).json(
      new APIresponse(
        200,
        { parentVideo, branchVideo },
        "Branch video linked successfully"
      )
    );
  } catch (error) {
    console.error("=== ERROR IN ADD BRANCH ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
});


const voteOnVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { value } = req.body; // value can be 1 or -1

  if (![1, -1].includes(value)) {
    throw new APIerror(400, "value must be 1 or -1");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new APIerror(403, "video not found");
  }

  const existingVote = video.voters.find(
    (v) => v.user.toString() === req.user._id.toString()
  );

  if (existingVote) {
    if (existingVote.value === value) {
      // toggle off if same vote
      video.votes -= existingVote.value;
      video.voters = video.voters.filter(
        (v) => v.user.toString() !== req.user._id.toString()
      );
    } else {
      // switch vote
      video.votes -= existingVote.value;
      existingVote.value = value;
      video.votes += value;
    }
  } else {
    // first vote
    video.voters.push({ user: req.user._id, value });
    video.votes += value;
  }

  await video.save();

  return res.status(200).json(
    new APIresponse(200, { video }, "voted successfully")
  );
});


const listStories = asyncHandler(async (req, res) => {
  const userId = req.user?._id; // Optional user for checking likes/saves

  const stories = await Story.find()
    .populate({
      path: "rootVideo",
      select: "title thumbnail votes",
    })
    .populate("createdBy", "username")
    .select("title description createdBy rootVideo likes shares likedBy savedBy createdAt updatedAt")
    .sort({ createdAt: -1 });

  // Add user interaction data if user is logged in
  const storiesWithUserData = stories.map(story => {
    const storyObj = story.toObject();
    
    if (userId) {
      storyObj.isLiked = story.likedBy.some(like => like.user.toString() === userId.toString());
      storyObj.isSaved = story.savedBy.some(save => save.user.toString() === userId.toString());
    } else {
      storyObj.isLiked = false;
      storyObj.isSaved = false;
    }
    
    // Don't expose the full likedBy and savedBy arrays for privacy
    delete storyObj.likedBy;
    delete storyObj.savedBy;
    
    return storyObj;
  });

  return res.status(200).json(
    new APIresponse(200, { stories: storiesWithUserData }, "All stories fetched successfully")
  );
});


const getFullStoryTree = asyncHandler(async (req, res) => {
  const { storyId } = req.params;

  const story = await Story.findById(storyId)
    .populate("createdBy", "username")
    .lean();

  if (!story) throw new APIerror(404, "Story not found");

  const fetchVideoWithBranches = async (videoId) => {
    const video = await Video.findById(videoId)
      .select("title thumbnail description votes branches videoFile views")
      .lean();

    if (!video) return null;

    video.branches = await Promise.all(
      (video.branches || []).map((branchId) => fetchVideoWithBranches(branchId))
    );

    return video;
  };

  const rootVideoTree = await fetchVideoWithBranches(story.rootVideo);

  return res.status(200).json(
    new APIresponse(200, { story, rootVideoTree }, "Full story tree fetched")
  );
});


const deleteStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) throw new APIerror(404, "Story not found");

  if (story.createdBy.toString() !== req.user._id.toString()) {
    throw new APIerror(403, "Not authorized to delete this story");
  }

  // delete videos linked to story
  await Video.deleteMany({ story: story._id });
  await story.deleteOne();

  return res.status(200).json(
    new APIresponse(200, {}, "Story deleted successfully")
  );
});


const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) throw new APIerror(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new APIerror(403, "Not authorized to delete this video");
  }

  
  if (video.parentVideo) {
    await Video.findByIdAndUpdate(video.parentVideo, {
      $pull: { branches: video._id },
    });
  }

  await video.deleteOne();

  return res.status(200).json(
    new APIresponse(200, {}, "Video deleted successfully")
  );
});

// Like/Unlike a story
const likeStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;
  const userId = req.user._id;

  const story = await Story.findById(storyId);
  if (!story) {
    throw new APIerror(404, "Story not found");
  }

  // Check if user already liked the story
  const existingLike = story.likedBy.find(
    (like) => like.user.toString() === userId.toString()
  );

  if (existingLike) {
    // Unlike: Remove user from likedBy array and decrease likes count
    story.likedBy = story.likedBy.filter(
      (like) => like.user.toString() !== userId.toString()
    );
    story.likes = Math.max(0, story.likes - 1);
  } else {
    // Like: Add user to likedBy array and increase likes count
    story.likedBy.push({ user: userId });
    story.likes += 1;
  }

  await story.save();

  return res.status(200).json(
    new APIresponse(
      200,
      { 
        story: {
          _id: story._id,
          likes: story.likes,
          isLiked: !existingLike
        }
      },
      existingLike ? "Story unliked successfully" : "Story liked successfully"
    )
  );
});

// Save/Unsave a story
const saveStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;
  const userId = req.user._id;

  const story = await Story.findById(storyId);
  if (!story) {
    throw new APIerror(404, "Story not found");
  }

  // Check if user already saved the story
  const existingSave = story.savedBy.find(
    (save) => save.user.toString() === userId.toString()
  );

  if (existingSave) {
    // Unsave: Remove user from savedBy array
    story.savedBy = story.savedBy.filter(
      (save) => save.user.toString() !== userId.toString()
    );
  } else {
    // Save: Add user to savedBy array
    story.savedBy.push({ user: userId });
  }

  await story.save();

  return res.status(200).json(
    new APIresponse(
      200,
      { 
        story: {
          _id: story._id,
          savedBy: story.savedBy.length,
          isSaved: !existingSave
        }
      },
      existingSave ? "Story unsaved successfully" : "Story saved successfully"
    )
  );
});

// Share a story (increment share count)
const shareStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) {
    throw new APIerror(404, "Story not found");
  }

  // Increment share count
  story.shares += 1;
  await story.save();

  return res.status(200).json(
    new APIresponse(
      200,
      { 
        story: {
          _id: story._id,
          shares: story.shares
        }
      },
      "Story shared successfully"
    )
  );
});

// Get user's liked stories
const getUserLikedStories = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const likedStories = await Story.find({
    "likedBy.user": userId
  })
    .populate({
      path: "rootVideo",
      select: "title thumbnail votes",
    })
    .populate("createdBy", "username")
    .sort({ "likedBy.likedAt": -1 });

  return res.status(200).json(
    new APIresponse(200, { stories: likedStories }, "Liked stories fetched successfully")
  );
});

// Get user's saved stories
const getUserSavedStories = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const savedStories = await Story.find({
    "savedBy.user": userId
  })
    .populate({
      path: "rootVideo",
      select: "title thumbnail votes",
    })
    .populate("createdBy", "username")
    .sort({ "savedBy.savedAt": -1 });

  return res.status(200).json(
    new APIresponse(200, { stories: savedStories }, "Saved stories fetched successfully")
  );
});

// Update story details
const updateStory = asyncHandler(async (req, res) => {
  const { storyId } = req.params;
  const { title, description } = req.body;
  const userId = req.user._id;

  const story = await Story.findById(storyId);
  if (!story) {
    throw new APIerror(404, "Story not found");
  }

  // Check if user is the creator or collaborator
  const isOwner = story.createdBy.toString() === userId.toString();
  const isCollaborator = story.collaborators.some(
    (collaborator) => collaborator.toString() === userId.toString()
  );

  if (!isOwner && !isCollaborator) {
    throw new APIerror(403, "Not authorized to update this story");
  }

  // Update story
  if (title) story.title = title;
  if (description) story.description = description;

  await story.save();

  const updatedStory = await Story.findById(storyId)
    .populate({
      path: "rootVideo",
      select: "title description videoFile thumbnail duration votes",
    })
    .populate("createdBy", "username")
    .populate("collaborators", "username");

  return res.status(200).json(
    new APIresponse(200, { story: updatedStory }, "Story updated successfully")
  );
});

export {
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
};
