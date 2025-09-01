import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const LikeSchema=new Schema(
  {
    content:{
      type:String,
      required:true
    },

    video:{
      type:Schema.Types.ObjectId,
      ref:"Video"
      
    },
  

    tweet:{
      type:Schema.Types.ObjectId,
      ref:"Tweet"
    },
    owner:{
      type:Schema.Types.ObjectId,
      ref:"User"
    },
    likedBy:{
      type:Schema.Types.ObjectId,
      ref:"User"
    }

  },
{timestamps:true})

likeSchema.plugin(mongooseAggregatePaginate)

export const Like=mongoose.model("Like",likeSchema)