import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/db.js";
const app = express()
//!we are saying here pass my .env data when i run my server
dotenv.config({
    path: './env'
})

const startServer = async () => {
    try {
        await connectDB();
        console.log("MongoDB connected successfully!");

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server running at http://localhost:${process.env.PORT || 8000}`);
        });

    } catch (error) {
        console.error("MongoDB connection failed!!", error);
        process.exit(1);
    }
};

startServer();
