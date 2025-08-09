import mongoose, { mongo } from "mongoose";
import { DB_NAME } from "./constants.js";
import dotenv  from "dotenv";
import { app } from "./app.js";
dotenv.config(
  //  path: '../.env' 
);


// import express from 'express';

// const app=express();

(async ()=>{
  try{
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("✅ MongoDB connected successfully");

    app.on("error",(error)=>{
      console.log("ERR:",error);
      throw error

    })
    app.listen(process.env.PORT,()=>{
      console.log(`🚀 App is listening on port:${process.env.PORT}`)

    })
  }
  catch(err){
    console.error("error is :",err);
    process.exit(1)
  }
})()
