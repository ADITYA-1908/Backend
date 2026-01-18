import jwt from "jsonwebtoken";
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
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //!saving refresh token in the mongoDB
        user.refreshToken = refreshToken

        //! do not add validation just save my data 
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
    if (!userName && !email) {
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

    //!only can modefiy by the server request not in frontend (readonly)
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

    //!find the user details
    await User.findByIdAndUpdate(
        //! remove refresh token
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        //!we will get new value here after no refresh token
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
        .clearCookie("Cookie_1", {
            httpOnly: false,
            secure: false
        })
        .json(
            new ApiResponse(
                200,
                {},
                "user logout successfully"
            )
        )
})

/*----------------------------refresh token----------------------------------*/
const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const inCommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if (!inCommingRefreshToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(inCommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (inCommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, newRefreshToken },
                    "access token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message, "invalid refresh token")
    }
})

/*-----------------------------------------change current password---------------------*/
const changeCurrentPassword = asyncHandler(async (req, res) => {

    //!Destructuring user input
    const { oldPassword, newPassword, confirmPassword } = req.body;

    //!Check if all fields are present
    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(400, "All fields are required");
    }

    //!Check if new passwords match
    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "New password and confirm password do not match");
    }

    //!Find the current logged-in user
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    //!Check if the old password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    //!Set the new password
    user.password = newPassword;

    //!new password is saved and gets hashed automatically
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    );
});

/*-----------------------------------------get current user---------------------*/
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetched successfully"
            )
        );
});

/*-----------------------------------------update user details---------------------*/
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    // Optional: Check if email already exists
    const emailExists = await User.findOne({ email, _id: { $ne: req.user._id } });

    if (emailExists) {
        throw new ApiError(409, "Email already in use");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email.toLowerCase()
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Account details updated successfully"));
});

/*-----------------------------------------Update user avatar---------------------*/
const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar is updated successfully"));
})

/*-----------------------------------------Update user --cover Image-------------------*/
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "cover image is updated successfully"));
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { userName } = req.params;

    if (!userName?.trim()) {
        throw new ApiError(400, "username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedCount: {
                    $size: "$subscriberTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscriberCount: 1,
                channelSubscribedCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "Channel profile fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})


export {
    changeCurrentPassword,
    getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser,
    refreshAccessToken, registerUser, updateAccountDetails,
    updateAvatar, updateCoverImage
};

