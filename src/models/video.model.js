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

  isUserUpload: {
     type: Boolean,
     default: true }

},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)
export const Video=mongoose.model("Video",videoSchema)