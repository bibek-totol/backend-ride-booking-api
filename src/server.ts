import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error("Startup error", err);
    process.exit(1);
  }
};

start();
