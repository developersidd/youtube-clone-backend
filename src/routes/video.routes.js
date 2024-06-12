import express from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishVideo,
  updateVideoById,
  updateVideoPublishStatus,
} from "../controllers/video.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishVideo
  )
  .get(getAllVideos);

// single video routes
router
  .route("/:id")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideoById);

// Toggle video publish status
router.route("/toggle/publish/:id").patch(updateVideoPublishStatus);

export default router;
