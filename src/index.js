import mongoose, { mongo } from "mongoose";
import { DB_NAME } from "./constants.js";
import dotenv  from "dotenv";

dotenv.config()

import express from 'express';

const app=express();

(async ()=>{
  try{
    mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error",(error)=>{
      console.log("ERR:",error);
      throw err

    })
    app.listen(process.env.PORT,()=>{
      console.log(`app is listening on port  ${process.env.PORT}`)

    })
  }
  catch(err){
    console.error("error is :",err);
    throw err
  }
})()
