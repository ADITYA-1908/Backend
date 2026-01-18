import { Router } from "express";
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription
} from "../controllers/subscription.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Subscribe / Unsubscribe a channel
router.post("/subscribe/:channelId", toggleSubscription);

// Get subscribers of a channel
router.get("/subscribers/:channelId", getUserChannelSubscribers);

// Get channels a user subscribed to
router.get("/subscribed/:subscriberId", getSubscribedChannels);

export default router;
