import { v2 as cloudinary } from "cloudinary"
import fs from 'fs'
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null
        }
        //!upload file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            //!it's says imge or video or audio
            resource_type: "auto"
        })
        //!file has been uploaded successfully
        // console.log("file is uploaded in the cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        //!remove the locally saved temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath)
        console.error("Cloudinary upload error:", error);

        //! Delete local file only if it exists
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
}

export default uploadOnCloudinary