import { Router } from "express";
import {
    changeCurrentPassword,
    getCurrentUser,
    loginUser, logoutUser,
    refreshAccessToken, registerUser,
    updateAccountDetails, updateAvatar, updateCoverImage
} from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([{
        name: "avatar",
        maxCount: 1
    }, {
        name: "coverImage",
        maxCount: 1
    }]),
    registerUser
);

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.patch(
    "/update-avatar",
    verifyJWT,
    upload.single("avatar"),
    updateAvatar
);

router.patch(
    "/update-cover",
    verifyJWT,
    upload.single("coverImage"),
    updateCoverImage
);

export default router;