import express from "express";
import {
  getLikedVideos,
  getVideoLikes,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import checkCache from "../middlewares/redisCache.middleware.js";

const router = express.Router();
router.get("/video/:videoId/:userId", checkCache, getVideoLikes);
router.use(verifyJWT);
router.get("/videos", checkCache, getLikedVideos);
router.post("/toggle/v/:videoId", toggleVideoLike);
router.post("/toggle/c/:commentId", toggleCommentLike);
router.post("/toggle/t/:tweetId", toggleTweetLike);

export default router;
