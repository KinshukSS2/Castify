import { asyncHandler } from "../utils/asyncHandler.js";
import { APIerror } from "../utils/APIerror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/APIresponse.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import jwt from "jsonwebtoken";
// import { urlencoded } from "express";

const generateAccessTokenAndRefreshTokens=async(userId)=>{
  try {
    const user= await User.findById(userId)
   const accessToken= user.generateAccessToken()
   const refreshToken= user.generateRefreshToken()

    user.refreshtoken=refreshToken
    await user.save({validateBeforeSave:false})
    return {accessToken,refreshToken}


  } catch (error) {
    throw new APIerror(500,"something went wrong will generating refresh and access tokens")
  }
}

const registeruser=asyncHandler(async(req,res)=>{

  const {fullname, email, username, password}=req.body
  console.log("email:",email)

  if(
  [fullname, email, username, password].some(
    (field) => !field || field.trim() === ""
  )
){
  throw new APIerror(400, "All fields are required");
}

const existedUser=await User.findOne({
  $or: [{username},{email}]
})
if(existedUser) {
  throw new ApiError(409,"user with email or username already exists")
}

let avatarLocalPath=undefined;
if (req.files?.avatar) avatarLocalPath=req.files?.avatar[0]?.path;

let coverimageLocalPath=undefined;
if (req.files?.coverimage) coverimageLocalPath=req.files?.coverimage[0]?.path;

if(!avatarLocalPath){
  throw new APIerror(400,"avatar file is required")
}

const avatar=await uploadOnCloudinary(avatarLocalPath)
const coverimage=await uploadOnCloudinary(coverimageLocalPath)
if(!avatar){
  throw new APIerror(400,"avatar file is required")

}

const user= await User.create({
  fullname,
  coverimage:coverimage?.url || "",
  email,
  avatar:avatar?.url,
  password,
  username:username?.toLowerCase()
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

const loginUser=asyncHandler(async (req,res)=>{
  
  // console.log("BODY:", req.body);
  const{email,username,password}=req.body 

  if(!(username || email)){
    throw new APIerror(400,"username or email is required")
  }

  const user=await User.findOne({
    $or: [{username},{email}]
  })

  if(!user){
    throw new APIerror(404,"user does not exist")
  }

  const passwordchecker=await user.isPasswordCorrect(password)
 if(!passwordchecker){
  throw new APIerror(401,"wrong password")
 }

 const {accessToken,refreshToken}=await generateAccessTokenAndRefreshTokens(user._id)

// cookies
const loggedInUser=await User.findById(user._id).
select("--refreshToken --password")

const options={
  httpOnly:true,
  secure:true
}
return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
  new APIresponse(
    200,
    {
      user:loggedInUser,accessToken,
      refreshToken
    },
    "User logged in successfully"
  )
)
})



const logoutUser=asyncHandler(async(req,res)=>{
 await  User.findByIdAndUpdate(
  req.user._id,{
    $set:{
      refreshToken:undefined
    }
  },{
    new:true
  }
)

const options={
  httpOnly:true,
  secure:true
}
return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new APIresponse(200,{},"user logged out"))
})


const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new APIerror(401,"unauthorized request")
   }
   try {
    const decodedToken=jwt.verify(
     incomingRefreshToken,
     process.env.REFRES_TOKEN_SECRET
    )
 
    const user=await User.findById(decodedToken?._id)
 
     if(!user){
     throw new APIerror(401,"invalid refresh token")
    }
 
    if(incomingRefreshToken !== user?.refreshToken){
     throw new APIerror(401,"refreh token in expired or invalid")
    }
 
    const options={
     httpOnly:true,
     secure:true
    }
    const {accessToken,newrefreshToken}= await generateAccessTokenAndRefreshTokens(user._id)
 
    return res
    .status(200)
    .cookie("accesstoken",accessToken,options)
    .cookie("refreshtoken",newrefreshToken,options)
    .json(
     new APIresponse(
       200,
       {accessToken,refreshToken:newrefreshToken},
       "accesstoken refreshed succesfully"
     )
    )
   } catch (error) {
    throw new APIerror(401,error?.message || "invalid refresh token")
    
   }
})



export {
  registeruser,
  loginUser,
  logoutUser,
  refreshAccessToken
}
