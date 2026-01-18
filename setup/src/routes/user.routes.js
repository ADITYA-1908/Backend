import { Router } from "express";
import {
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getWatchHistory
} from "../controllers/user.controller.js";

import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

/* ---------- Auth ---------- */
router.post(
    "/register",
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-token", refreshAccessToken);

/* ---------- User ---------- */
router.get("/current-user", verifyJWT, getCurrentUser);
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.patch("/update-account", verifyJWT, updateAccountDetails);

/* ---------- Profile Images ---------- */
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

/* ---------- Channel Profile ---------- */
router.get(
    "/channel/:userName",
    verifyJWT, // optional
    getUserChannelProfile
);
router.get(
    "/history",
    verifyJWT,
    getWatchHistory
)

export default router;
