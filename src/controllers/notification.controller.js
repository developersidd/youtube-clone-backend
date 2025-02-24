import NotificationModel from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateCacheKey, setCache } from "../utils/redis.util.js";

const getNotifications = asyncHandler(async (req, res) => {
  const { _id, role } = req?.user || {};
  const cacheKey = generateCacheKey("notifications", _id, role);
  //  const cachedData = await checkCache(req, cacheKey);
  //  if (cachedData) {
  //      return res.status(200).json(cachedData);
  //    }
  const notifications = await NotificationModel.find({
    $or: [{ recipient: _id?.toString() }, { type: role }],
  }).sort({ createdAt: -1 });
  console.log(" notifications:", notifications);
  const response = new ApiResponse(
    200,
    notifications,
    "Notifications retrieved successfully"
  );
  await setCache(req, response, cacheKey);
  return res.status(200).json(response);
});

// update read status of a notification
const updateNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await NotificationModel.findByIdAndUpdate(
    id,
    { read: true },
    { new: true }
  );
  if (!notification) {
    return new ApiError(404, null, "Notification not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, notification, "Notification updated successfully")
    );
});

export { getNotifications, updateNotification };
