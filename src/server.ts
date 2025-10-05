import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import connectDB from "./config/db";
import { initRedis } from "./config/redis";

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await connectDB();
    await initRedis().catch((err) => {
      console.error("Redis connection error:", err);
      process.exit(1);
    });
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error("Startup error", err);
    process.exit(1);
  }
};

start();
