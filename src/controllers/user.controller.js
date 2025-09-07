import { asyncHandler } from "../utils/asyncHandler.js";
import { APIerror } from "../utils/APIerror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/APIresponse.js";
import jwt from "jsonwebtoken";



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
select("-refreshtoken -password")

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
  try {
    // Check if user exists in request (from auth middleware)
    if (!req.user || !req.user._id) {
      throw new APIerror(401, "User not authenticated");
    }

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshtoken: 1 // This removes the field from document
        }
      },
      {
        new: true
      }
    );

    const options = {
      httpOnly: true,
      secure: true
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new APIresponse(200, {}, "User logged out successfully"));

  } catch (error) {
    throw new APIerror(500, error?.message || "Error during logout");
  }
});

const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new APIerror(401,"unauthorized request")
   }
   try {
    const decodedToken=jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )
 
    const user=await User.findById(decodedToken?._id)
 
     if(!user){
     throw new APIerror(401,"invalid refresh token")
    }
 
    if(incomingRefreshToken !== user?.refreshtoken){
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


const changePassword=asyncHandler(async(req,res)=>{

  const{oldpassword,newpassword,confpassword}=req.body
  if(!(newpassword === confpassword)){
    throw new APIerror(401,"incorrect entry in confirmation or new password ")
  }

  const user =await  User.findById(req.user?._id)

  const isPasswordCorrect=await user.isPasswordCorrect(oldpassword)
  if(!isPasswordCorrect){
    throw new APIerror(401,"invalid present password")
  }

  user.password=newpassword
  await user.save();

   return res
   .status(200)
   .json({ success: true, message: "Password updated successfully" });
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"current user fetched successfully")
})


const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;


  const updateFields = {};
  if (fullname) updateFields.fullname = fullname;
  if (email) updateFields.email = email;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateFields },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new APIerror(404, "User not found");
  }

  return res.status(200).json({
    success: true,
    user,
    message: "Account details updated successfully"
  });
})


const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path
  if(!avatarLocalPath){
    throw new APIerror(400,"avatar path not found")
  }

  const avatar=await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url)
{
  throw new APIerror(401,"avatar uploading error")
}
const user=await  User.findByIdAndUpdate(
  req.user?._id,

  {
    $set:{
      avatar:avatar.url
    }
  },
  { new: true }
 ).select("-password")


 return res
 .status(200)
 .json(new APIresponse(200,user,"Account avatar has been updated"))


})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path
  if(!coverImageLocalPath){
    throw new APIerror(400,"cover page path not found")
  }

  const coverImage=await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url)
{
  throw new APIerror(401,"coverImage uploading error")
}
const user=await  User.findByIdAndUpdate(
    req.user?._id,
  {
    $set:{
      coverimage:coverImage.url
    },
  },
  {new:true}
 ).select("-password")


 return res
 .status(200)
 .json(new APIresponse(200,user,"Account coverImage has been updated"))

})

// const getChannelUserProfile=asyncHandler(async(req,res)=>{
//   const {username}=req.params
//   if(!username?.trim()){
//     throw new APIerror(400,"username is missing")
//   }

//   const channel=await  User.aggregate([
//     {
//       $match:{
//         username:username?.toLowerCase()
//       }
//     },
//     {
//       $lookup:{
//         from:"subscriptions",
//         localField:"_id",
//         foreignField:"channel",
//         as:"subscribers"
//       }
//     },
//     {
//       $lookup:{
//         from:"subscriptions",
//         localField:"_id",
//         foreignField:"subscriber",
//         as:"subscribedTo"
//       },
//     },
//     {
//     $addFields:{
//       subscribersCount:{
//         $size:"$subscribers"
//       }, 
//       channelsSubscribedToCount:{
//         $size:"$subscribedTo"
//       },
//       isSubscribed:{
//         $cond:{
//           if:{$in :[req.user?._id,"$subscribers.subscriber"]},
//           then:true,
//           else:false
//         }
//       }


//     }
//     },
//     {
//       $project:{
//         fullName: 1,
//         username: 1,
//         subscribersCount: 1,
//         channelSubscribedToCount: 1,
//         avatar: 1,
//         coverimage: 1,
//         email: 1,
//       }
//     }

//   ])

//   if(!channel?.length){
//     throw new APIerror(404,"channel does not exist")
//   }
//   return res
//   .status(200)
//   .json(
//     new APIresponse(200,channel[0],"User channel fetched successfully")
//   )
// })

// const getWatchHistory=asyncHandler(async(req,res)=>{
//   const user=await User.aggregate([
//     {
//       $match:{
//         _id:new mongoose.Types.ObjectId(req.user._id)
//       }
//     },

//     {
//       $lookup:{
//         from:"videos",
//         localField:"watchHistory",
//         foreignField:"_id",
//         as:"watchHistory",
//         pipeline:[
//           {
//             $lookup:{
//               from:"users",
//               localField:"owner",
//               foreignField:"_id",
//               as:"owner",
//               pipeline:[
//                 {
//                   $project:{
//                     fullname:1,
//                     username:1,
//                     avatar:1
                    
//                   }
//                 }
//               ]
//             }
//           },
//           {
//             $addFields:{
//               owner:{
//                 $first:"$owner"
//               }
//             }
//           }
           
//         ]
//       }
//     }

//   ])

//   return res
//   .status(200)
//   .json(
//     new APIresponse(
//       200,
//       user[0].watchHistory,
//       "Watch history fetched successfully"
//     )
//   )
// })






export {
  registeruser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,

}
