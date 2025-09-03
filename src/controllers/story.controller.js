import { asyncHandler } from "../utils/asyncHandler.js";
import { APIerror } from "../utils/APIerror.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Story } from "../models/story.model.js";
import { APIresponse } from "../utils/APIresponse.js";

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
    select: "title description",
    populate: { path: "branches", select: "title thumbnail" },
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

  console.log("Body:", req.body);


  if (!branchVideoId) {
    throw new APIerror(400, "branchVideoId is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new APIerror(404, "video not found");
  }

  const branchVideo = await Video.findById(branchVideoId);
  if (!branchVideo) {
    throw new APIerror(404, "branch video not found");
  }

  video.branches.push(branchVideoId);
  await video.save();

  return res.status(200).json(
    new APIresponse(200, { video }, "branch video added successfully")
  );
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
      .select("title thumbnail description votes branches")
      .lean();

    if (!video) return null;

    video.branches = await Promise.all(
      video.branches.map((branchId) => fetchVideoWithBranches(branchId))
    );

    return video;
  };

  const rootVideoTree = await fetchVideoWithBranches(story.rootVideo);

  return res.status(200).json(
    new APIresponse(200, { story, rootVideoTree }, "Full story tree fetched")
  );
});

//here story means the whole tree
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

//here video means node of the story tree
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
