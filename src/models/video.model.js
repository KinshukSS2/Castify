import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const videoSchema=new mongoose.Schema({
  videoFile:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  duration:{
    type:Number,
    required:true
  },
  thumbnail:{
    type:String,
    required:true
  },

  title:{
    type:String,
    required:true
  },

  views:{
    type:Number,
    default:0
  },

  isPublished:{
    type:Boolean,
    default:true
  },

  owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
  },

  story:{
    type:Schema.Types.ObjectId,
    ref:'Story'
  },
  parentVideo:{
    type:Schema.Types.ObjectId,
    ref:'Video',
    default:null
  },
  branches:
    [{ type: Schema.Types.ObjectId,
       ref: "Video"
    }],

  votes: {
    type: Number,
     default: 0
    },

  voters: [
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    value: { type: Number, enum: [1, -1] }                          // 1 = upvote, -1 = downvote  just like reddit
  }
  ],

  isUserUpload: {
     type: Boolean,
     default: true },


   sourceAPI: {
      type: String,
      default: null,
    },

},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)
export const Video=mongoose.model("Video",videoSchema)