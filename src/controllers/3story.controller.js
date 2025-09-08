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
  const stories = await Story.find()
    .populate({
      path: "rootVideo",
      select: "title thumbnail votes",
    })
    .populate("createdBy", "username");

  return res.status(200).json(
    new APIresponse(200, { stories }, "All stories fetched successfully")
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

  // remove reference from parent
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

export {
  createStory,
  getStory,
  addBranchToVideo,
  voteOnVideo,
  listStories,
  getFullStoryTree,
  deleteStory,
  deleteVideo
};
