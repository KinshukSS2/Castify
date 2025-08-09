import { asyncHandler } from "../utils/asyncHandler.js";
import { APIerror } from "../utils/APIerror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/APIresponse.js";


const registeruser=asyncHandler(async(req,res)=>{

  const {fullname, email, username, password}=req.body
  console.log("email:",email)

  if (
  [fullname, email, username, password].some(
    (field) => !field || field.trim() === ""
  )
) {
  throw new APIerror(400, "All fields are required");
}

const existedUser=User.findOne({
  $or: [{username},{email}] 
})
if(existedUser) {
  throw new ApiError(409,"user with email or username already exists")
}

const avatarLocalPath=req.files?.avatar[0]?.path;
const coverimageLocalPath=req.files?.coverimage[0]?.path;

if(!avatarLocalPath){
  throw new APIerror(400,"avatar file is required")
}


const avatar=await uploadOnCloudinary(avatarLocalPath)
const coverimage=await uploadOnCloudinary(coverimageLocalPath)
if(!avatar){
  throw new APIerror(400,"avatar file is required")

}

const user= await User.create({
  fullname:avatar.url,
  coverimage:coverimage.url || "",
  email,
  password,
  username:username.toLowerCase()
})

const createdUser=await User.findById(user._id).select(
  "-password -refreshtoken"
)

if(!createdUser){
  throw new APIerror(500,"something went wrong while registering the user")
}



  return res.status(201).json(
   new APIresponse(200,createdUser,"user registerd successfully")
  )

})


export {
  registeruser,
}