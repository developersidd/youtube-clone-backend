import { Schema, Types, model } from "mongoose";

const videoEntrySchema = new Schema({
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
});

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "Name is Required"],
      max: [150, "Name cannot be more than 150 characters"],
    },
    description: {
      type: String,
      max: [500, "Description cannot be more than 500 characters"],
    },
    owner: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "Owner is Required"],
    },
    videos: [videoEntrySchema],

    type: {
      type: String,
      enum: ["collection", "playlist"],
      default: "playlist",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
playlistSchema.index({ name: 1, owner: 1 }, { unique: true });

const Playlist = model("Playlist", playlistSchema);
export default Playlist;
