// Dependencies
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { createClient } from "redis";
import requestIp from "request-ip";
import { Server } from "socket.io";
// import Routes
import { isValidObjectId } from "mongoose";
import commentRouter from "./routes/comment.routes.js";
import dislikeRouter from "./routes/dislike.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import likeRouter from "./routes/like.routes.js";
import loginHistoryRouter from "./routes/loginHistory.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

import ApiError from "./utils/ApiError.js";
// App Initialization
const app = express();
const server = http.createServer(app);
// Redis Cache
const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

// Redis Error Handling
redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

// Connect to Redis
(async () => {
  try {
    const res = await redisClient.connect();
    console.log("Connected to Redis");
    app.locals.redisClient = res;
  } catch (err) {
    console.error("Could not connect to Redis:", err);
  }
})();

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Middleware to authenticate Socket.io connections
io.use((socket, next) => {
  const { token } = socket.handshake.auth || {};
  console.log(" token:", token);
  if (!token) return next(new Error("Authentication error"));

  // Verify JWT (example using jsonwebtoken)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    console.log(" decoded:", decoded);
    if (err) return next(new Error("Unauthorized"));
    socket.user = decoded;
    next();
  });
});

// Handle connections
io.on("connection", (socket) => {
  const { role = "", _id } = socket.user || {};
  if (isValidObjectId(_id)) {
    socket.join(`user-${_id}`);
    console.log(`User ${_id} connected`);

    if (role.trim() === "ADMIN") {
      socket.join("admin-room");
      console.log(`Admin ${socket.id} joined admin room`);
      // socket.emit("registration", { test: "Admin connection successful" });
    }
  }
  socket.on("disconnect", (reason) => {
    // console.log(" reason:", reason);
    console.log("Disconnected:", socket.id);
  });
});

// Attach io instance to Express app
app.set("io", io);

// Middlewares
app.use(express.json({ limit: "20kb" }));
// for parsing application/x-www-form-urlencoded data from the client side form submission (e.g., login form) and extended: true allows for nested objects in the form data
app.use(express.urlencoded({ limit: "20kb" }));
// Anything in this directory will be served up as static content.
app.use(express.static("public"));
app.use(cors({ credentials: true, origin: process.env.CORS_ORIGIN }));
app.use(cookieParser());

app.use(requestIp.mw());
// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/dislikes", dislikeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/notifications", notificationRouter);

app.use("/api/v1/login-history", loginHistoryRouter);
app.use("/healthcheck", healthcheckRouter);
// 404 Error Handler
app.use((req, res, next) => {
  const error = new ApiError(404, "Page Not Found");
  next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  return res.status(statusCode).json({
    ...err,
    message,
  });
});

export { app, server };
