import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { fileURLToPath } from "url";

import connectDB from "./src/config/database.js";
import { startCronJobs } from "./src/utils/cronJobs.js";
import { geoBlock } from "./src/middleware/geoBlock.js";
import { systemLogger } from "./src/middleware/logger.js";

import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

connectDB();
startCronJobs();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? process.env.CLIENT_URL : true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(geoBlock, systemLogger);
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/orders", orderRoutes);

app.get("*", (req, res, next) => {
  if (req.url.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;

  console.error(`[Server Error]: ${err.stack}`);

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An internal error occurred"
        : err.message,
  });
});

app.listen(PORT, () => {
  console.log(
    `Car Wash Server is LIVE | Port: ${PORT} | Mode: ${process.env.NODE_ENV || "development"}`,
  );
});
