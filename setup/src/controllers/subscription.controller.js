import { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandlers.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const existingSub = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSub) {
        await existingSub.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, {}, "Unsubscribed successfully")
        );
    }

    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    });

    return res.status(201).json(
        new ApiResponse(201, {}, "Subscribed successfully")
    );
});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "fullName userName avatar");

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id");
    }

    const channels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "fullName userName avatar");

    return res.status(200).json(
        new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
});


export {
    getSubscribedChannels, getUserChannelSubscribers, toggleSubscription
}

