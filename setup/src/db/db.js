import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB = async () => {
    try {
        const connected = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`mongodb is connected ${connected.connection.host}`)
    } catch (error) {
        console.error("MongoDB connection FAILED", error)
        process.exit(1)
    }
}

export default connectDB