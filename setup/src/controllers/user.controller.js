import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandlers.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

/*----------------------------generate token ----------------------------------*/

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        //!both the token is generated
        const accessToken = user.generateAccessToken
        const refreshToken = user.generateRefreshToken

        //!saving refresh token in the mongoDB
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh token")
    }
}

/*----------------------------user registration ----------------------------------*/
const registerUser = asyncHandler(async (req, res) => {

    //!get user data from frontend
    const { fullName, password, userName, email } = req.body

    //!validation-not empty
    if ([fullName, email, password, userName].some((fileds) => fileds.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    //!check if user already exist
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "user name or emailid is already exist")
    }

    //!check for images ,check for avatar
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverLocalPath = req.files?.coverImage?.[0]?.path;

    //!we can register without cover image
    let coverImageLocalPath = null;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //!upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //!create user object - create entry in db 
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    //!remove password and referesh token filed form response 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //!check for user creation 
    if (!createdUser) {
        throw new ApiError(500, "not register")
    }

    //!return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user Register succesfully")
    )
});


/*----------------------------user login----------------------------------*/
const loginUser = asyncHandler(async (req, res) => {

    //!take data from body.req
    const { userName, email, password } = req.body

    //!username or email 
    if ((!userName || !email)) {
        throw new ApiError(400, "username or email is required")
    }

    //!find user of register user
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    //!password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect")
    }
    //!access token and refresh token 
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    //!send access token to the cookie
    const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken")

    //!only can modefiy by the server not in frontend (readonly)
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)

        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "user logedin successfully"
            )
        )

})

/*----------------------------user logout----------------------------------*/
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        { new: true }
    );

    //!only can modefiy by the server not in frontend (readonly)
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)

        .json(
            new ApiResponse(
                200,
                {

                },
                "user logout successfully"
            )
        )
})


export { loginUser, logoutUser, registerUser };

