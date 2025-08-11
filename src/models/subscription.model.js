import mongoose, { Schema } from "mongoose";
import { User } from "./user.model";

const subscriptionSchema=new mongoose.Schema({
  id:{
    type:String,
    required:true,
  },
  subscriber:{
    type:Schema.Types.ObjectId,
    ref:User
  },
  channel:{
    type:Schema.Types.ObjectId,
    ref:User
  }


},{timestamps:true})


export const Subscription=mongoose.model("Subscription",subscriptionSchema)
