import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from "express"
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    //!It tells the server to allow cookies, tokens, or authentication headers to be sent from the frontend to the backend.
    credentials: true
}))

//! Parses incoming JSON data from the request body
app.use(express.json({ limit: "16kb" }))

//!Parses URL-encoded form data (extended means it will Allows nested objects, arrays, and complex data)
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

//! serve static file 
app.use(express.static("public"))

//!to access cookies and set cookies 
app.use(cookieParser())




export default app