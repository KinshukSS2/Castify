import { asyncHandler } from "../utils/asyncHandler.js";
import { APIerror } from "../utils/APIerror.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Story } from "../models/story.model.js";
import { APIresponse } from "../utils/APIresponse.js";

// import { urlencoded } from "express";

const createStory=asyncHandler(async(req,res)=>{
  const {title,description,rootVideoId}=req.body

  if(!title || !description || !rootVideo){
    throw new APIerror(400,"title, description and rootVideo are required to create a story")
  }
  const rootVideo=await Video.findById(rootVideoId);
  if(!rootVideo){
    throw new APIerror(404,"root video not found")
  }

  const story=await Story.create({
    title,
    description,
    rootVideo:rootVideoid,
    createdBy:req.user._id
  });


  rootVideo.story=story._id
  await rootVideo.save()
  
  return res.status(200).json(
    new APIresponse(
      200,
      {story},
      "story created successfully"
    )
  )

})

const getStory=asyncHandler(async(req,res)=>{
  const {storyId}=req.params
  const story=await Story.findById(storyId)
  .populate({
    path:"rootVideo",
    select:"title description",
    populate: { path: "branches", select: "title thumbnail" }
  })
  if(!story){
    throw new APIerror(404,"story not found")
  }
  return res.status(200).json(
    new APIresponse(
      200,
      {story},
      "story fetched successfully"
    )
  )
})


export {createStory}