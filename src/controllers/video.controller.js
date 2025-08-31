import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
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


const getAllVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const videos = await Video.find()
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Video.countDocuments();

  res.status(200).json({
    page,
    limit,
    totalVideos: total,
    totalPages: Math.ceil(total / limit),
    videos,
  });
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

export {
  publishVideo,
  getAllVideos,
  getvideoById
}