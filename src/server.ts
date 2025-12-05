import dotenv from "dotenv";
dotenv.config();
import app, { server } from "./app";
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
   server.listen(PORT, () => {
  console.log(`Server running with sockets on port ${PORT}`);
});
  } catch (err) {
    console.error("Startup error", err);
    process.exit(1);
  }
};

start();
