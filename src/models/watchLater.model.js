import { Schema, Types, model } from "mongoose";

const videoEntrySchema = new Schema(
  {
    video: {
      type: Types.ObjectId,
      ref: "Video",
      required: [true, "Video reference is required"],
    },
    position: {
      type: Number,
      required: [true, "Position is required"],
      default: 0,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const watchLaterSchema = new Schema(
  {
    owner: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true, // Ensures one watch later list per user
    },
    videos: [videoEntrySchema],
  },
  {
    timestamps: true,
  }
);

watchLaterSchema.index({ user: 1, "videos.video": 1 });
const WatchLater = model("WatchLater", watchLaterSchema);

export default WatchLater;
