import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'


cloudinary.config({
    cloud_name: 'dz8ecnv1e', 
  api_key: '734689284758878', 
  api_secret: 'RqqDcszBb-liNreuFCjiIOjvOwc'

});

const uploadOnCloudinary = async (localFilePath)=>{
  try{
    if(!localFilePath)return null;
    const response = await cloudinary.uploader.upload(localFilePath,
    {resource_type:"auto"
  })

  console.log("file has been uploaded",response.url);
}catch(error){
  fs.unlinkSync(localFilePath)
  // console.error("the error is :",err)
  return null;
  }

}

export {uploadOnCloudinary}

// api env variable ::    CLOUDINARY_URL=cloudinary://734689284758878:RqqDcszBb-liNreuFCjiIOjvOwc@dz8ecnv1e