import { asyncHandler } from "../utils/asyncHandler.js"
import { APIerror } from "../utils/APIerror.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const  verifyJWT=asyncHandler(async(req,res,next)=>{
  
  try {
    const token=req.cookies?.accessToken || req.header
    ("Authorization")?.replace("Bearer ","")
    
    if(!token){
      throw new APIerror(401,"unauthorized request")
    }
  
    const decodedtoken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const user=await User.findById(decodedtoken?._id).select("-password -refreshToken")
  
    if(!user){
      throw new APIerror(401,"invalid access token")
    }
    req.user=user;
    next()
  } catch (error) {
    throw new APIerror(401,error?.message ||
      "invalid access token"
    )
    
  }
})


