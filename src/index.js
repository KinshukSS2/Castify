import mongoose, { mongo } from "mongoose";
import { DB_NAME } from "./constants.js";
import dotenv  from "dotenv";
import { app } from "./app.js";

// Load environment variables
dotenv.config();

(async ()=>{
  try{
      // Check if MONGODB_URI exists
      if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI environment variable is not defined!");
        console.error("Available env vars:", Object.keys(process.env).filter(key => key.includes('MONGO')));
        process.exit(1);
      }

      console.log("🔌 Attempting MongoDB connection...");
      console.log("📍 MongoDB URI exists:", !!process.env.MONGODB_URI);
      
      // Connect to MongoDB with proper error handling
      const connectionString = `${process.env.MONGODB_URI}/${DB_NAME}`;
      await mongoose.connect(connectionString);
      console.log("✅ MongoDB connected successfully to:", DB_NAME);

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
