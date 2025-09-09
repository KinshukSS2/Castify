import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import { APIerror } from "../utils/APIerror.js"
import { APIresponse } from "../utils/APIresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const publishVideo = asyncHandler(async (req, res) => {
  let videoLocalPath;

  console.log(req)

  if (req?.files['videoFile']) {
    videoLocalPath = req.files['videoFile'][0]?.path;
    console.log(videoLocalPath)
  }

  if (!videoLocalPath) {
    throw new APIerror(400, "Video path not found");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  if (!video || !video.url) {
    throw new APIerror(400, "Video upload failed");
  }

  
  let thumbnailUrl = "";
  if (req.files?.thumbnail) {
    const thumbLocalPath = req.files.thumbnail[0]?.path;
    const thumbnail = await uploadOnCloudinary(thumbLocalPath);
    if (!thumbnail?.url) {
      throw new APIerror(400, "Thumbnail upload failed");
    }
    thumbnailUrl = thumbnail.url;
  } else {
    throw new APIerror(400, "Thumbnail is required");
  }

  
  const newVideo = await Video.create({
    videoFile: video.url,
    title: req.body.title,
    description: req.body.description,
    duration: video.duration || 0,
    thumbnail: thumbnailUrl,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new APIresponse(201, newVideo, "Video has been uploaded successfully"));
});

const getvideoById = asyncHandler(async(req,res)=>{

  const video=await Video.findById(req.params.id)
  if(!video){
    throw new APIerror(400,"video not found")
  }

  return res
  .status(200)
  .json(new APIresponse(200,video,"got video by id"))
});

const getAllVideos = asyncHandler(async (req, res) => {
  console.log(" getAllVideos API called");
  console.log(" Query params:", req.query);
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // Get user ID if authenticated (from optional auth middleware)
  const userId = req.user?._id;

  console.log(` Fetching videos - Page: ${page}, Limit: ${limit}, User: ${userId || 'Anonymous'}`);

  const videos = await Video.find()
    .skip((page - 1) * limit)
    .limit(limit);

  console.log(` Found ${videos.length} videos in database`);
  console.log("🔍 Sample video data:", videos[0] ? {
    id: videos[0]._id,
    title: videos[0].title,
    thumbnail: videos[0].thumbnail,
    videoFile: videos[0].videoFile
  } : "No videos found");

  // Calculate vote counts and user vote state for each video
  const videosWithVotes = videos.map(video => {
    const upvotes = video.voters ? video.voters.filter(v => v.value === 1).length : 0;
    const downvotes = video.voters ? video.voters.filter(v => v.value === -1).length : 0;
    
    // Check if current user has voted (only if authenticated)
    let userVoteState = 'none';
    if (userId && video.voters) {
      const userVote = video.voters.find(v => v.user.toString() === userId.toString());
      if (userVote) {
        userVoteState = userVote.value === 1 ? 'upvoted' : 'downvoted';
      }
    }
    
    return {
      ...video.toObject(),
      upvotes,
      downvotes,
      userVoteState
    };
  });

  const total = await Video.countDocuments();
  console.log(`📈 Total videos in database: ${total}`);

  const response = {
    page,
    limit,
    totalVideos: total,
    totalPages: Math.ceil(total / limit),
    videos: videosWithVotes,
  };

  console.log("✅ Sending response:", {
    page: response.page,
    totalVideos: response.totalVideos,
    videosCount: response.videos.length,
    firstVideoTitle: response.videos[0]?.title || "No videos"
  });

  res.status(200).json(response);
});

const getMyVideos = asyncHandler(async (req, res) => {
  // Get videos uploaded by the current authenticated user
  const myVideos = await Video.find({ owner: req.user._id })
    .sort({ createdAt: -1 })  // Latest first
    .populate('owner', 'username avatar')
    .select('title description thumbnail videoFile duration createdAt views votes');

  return res
    .status(200)
    .json(new APIresponse(200, { videos: myVideos }, "Fetched user's videos successfully"));
});

// Alternative endpoint for URL-based video publishing (for populator)
const publishVideoFromUrl = asyncHandler(async (req, res) => {
  const { title, description, videoFile, thumbnail, duration } = req.body;

  console.log("Publishing video from URL:", { title, videoFile, thumbnail });

  if (!title || !description || !videoFile) {
    throw new APIerror(400, "Title, description, and video URL are required");
  }

  // Create video with direct URLs (for demo/populator content)
  const newVideo = await Video.create({
    videoFile: videoFile,
    title: title,
    description: description,
    duration: duration || 30,
    thumbnail: thumbnail || `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
    owner: req.user._id,
    isPublished: true,
  });

  if (!newVideo) {
    throw new APIerror(500, "Failed to create video record");
  }

  console.log("Video created successfully:", newVideo._id);

  return res.status(201).json(
    new APIresponse(201, newVideo, "Video published successfully")
  );
});

const voteOnVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { voteType } = req.body; // 'upvote' or 'downvote'
  const userId = req.user._id; // Get authenticated user ID

  if (!isValidObjectId(videoId)) {
    throw new APIerror(400, "Invalid video ID");
  }

  if (!['upvote', 'downvote'].includes(voteType)) {
    throw new APIerror(400, "Invalid vote type. Must be 'upvote' or 'downvote'");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new APIerror(404, "Video not found");
  }

  // Initialize voters array if it doesn't exist
  if (!video.voters) video.voters = [];

  const voteValue = voteType === 'upvote' ? 1 : -1;
  
  // Check if user has already voted
  const existingVoteIndex = video.voters.findIndex(
    voter => voter.user.toString() === userId.toString()
  );

  if (existingVoteIndex !== -1) {
    const existingVote = video.voters[existingVoteIndex];
    
    if (existingVote.value === voteValue) {
      // Same vote - remove it (toggle off)
      video.voters.splice(existingVoteIndex, 1);
      video.votes -= voteValue;
    } else {
      // Different vote - update it
      video.votes -= existingVote.value; // Remove old vote
      existingVote.value = voteValue; // Update to new vote
      video.votes += voteValue; // Add new vote
    }
  } else {
    // First vote from this user
    video.voters.push({ user: userId, value: voteValue });
    video.votes += voteValue;
  }

  await video.save();

  // Calculate upvotes and downvotes for response
  const upvotes = video.voters.filter(v => v.value === 1).length;
  const downvotes = video.voters.filter(v => v.value === -1).length;
  
  // Get current user's vote state
  const userVote = video.voters.find(v => v.user.toString() === userId.toString());
  const userVoteState = userVote ? (userVote.value === 1 ? 'upvoted' : 'downvoted') : 'none';

  return res.status(200).json(
    new APIresponse(200, {
      upvotes,
      downvotes,
      totalVotes: video.votes,
      userVoteState // Tell frontend what the user's current vote is
    }, `Vote processed successfully`)
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new APIerror(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new APIerror(404, "Video not found");
  }

  // Check if user owns the video
  if (!video.owner.equals(userId)) {
    throw new APIerror(403, "You can only delete your own videos");
  }

  await Video.findByIdAndDelete(videoId);

  return res.status(200).json(
    new APIresponse(200, {}, "Video deleted successfully")
  );
});

export {
  publishVideo,
  getAllVideos,
  getvideoById,
  getMyVideos,
  publishVideoFromUrl,
  voteOnVideo,
  deleteVideo
};
