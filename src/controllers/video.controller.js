import { Types } from "mongoose";
import Video from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import formatDuration from "../utils/formatDuration.js";

// Get all videos

const getAllVideos = asyncHandler(async (req, res) => {
  // Extract pagination parameters from query string
  const {
    page = 3,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query || {};
  // search query
  const searchQuery = { isPublished: true };
  if (userId) {
    const mongoId = new Types.ObjectId(userId);
    searchQuery.owner = mongoId;
  }
  // sort query
  const sortQuery = {};
  if (sortBy) {
    sortQuery[sortBy] = sortType === "desc" ? -1 : 1;
  } else {
    sortQuery.createdAt = -1;
  }

  // Create the aggregation pipeline
  const aggregateQuery = Video.aggregate([
    {
      $match: searchQuery,
    },
    {
      $sort: sortQuery,
    },
    /* {
      $project: {
        // Project only necessary fields
        title: 1,
        description: 1,
        thumbnail: 1,
        views: 1,
        duration: 1,
        createdAt: 1,
      },
    }, */
  ]);

  // Use aggregatePaginate for pagination
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Video.aggregatePaginate(aggregateQuery, options);
  console.log("result:", JSON.stringify(result, null, 2));
  res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: result.docs,
        totalVideos: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.page,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
      "Videos found"
    )
  );
});

//  Publish a video
const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoLocalPath = (req.files?.videoFile ?? [])[0]?.path;
  const thumbnailLocalPath = (req.files?.thumbnail ?? [])[0]?.path;
  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail and Video Files are required");
  }
  if ([title, description].some((value) => value?.trim() === "")) {
    throw new ApiError(400, "Please provide All required fields");
  }
  //  upload video and thumbnail on cloudinary
  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile?.public_id) {
    throw new ApiError(500, "Failed to upload video file");
  }
  if (!thumbnail?.public_id) {
    throw new ApiError(500, "Failed to upload thumbnail file");
  }
  const duration = formatDuration(videoFile.duration);
  const video = await Video.create({
    title,
    description,
    video: {
      url: videoFile.secure_url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnail.secure_url,
      public_id: thumbnail.public_id,
    },
    duration,
    owner: req.user._id,
  });
  console.log("video:", video);
  res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

export { getAllVideos, publishVideo };
