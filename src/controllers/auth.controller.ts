import { Request, Response } from "express";
import User from "../models/user.model";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { getRedis } from "../config/redis";
import { loginSchema, registerSchema } from "../validation/schemas";
import { maskToken } from "../utils/maskToken";

export const register = async (req: Request, res: Response) => {
  try {
    const redisClient = getRedis();
    const data = registerSchema.parse(req.body);

    const existing = await User.findOne({ email: data.email });
    if (existing)
      return res
        .status(400)
        .json({ message: "Email already in use", status: 400 });

    const hashed = await hashPassword(data.password);
    const user = await User.create({ ...data, password: hashed });

    const existingRefreshToken = await redisClient.get(
      `refresh-token:${user._id}`
    );
    if (existingRefreshToken) {
      await redisClient.del(`refresh-token:${user._id}`);
    }

    const accessToken = generateAccessToken({ id: String(user._id), role: user.role });
    const refreshToken = generateRefreshToken({
      id:  String(user._id),
      role: user.role,
    });

    await redisClient.set(`refresh-token:${user._id}`, refreshToken, {
      EX: 7 * 24 * 60 * 60,
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: maskToken(accessToken),
      refreshToken: maskToken(refreshToken),
      message: "User registered successfully",
      status: 201,
    });
  } catch (err: any) {
    res
      .status(400)
      .json({ message: err.message || "Invalid data", status: 400 });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const redisClient = getRedis();
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });
    if (!user)
      return res.status(404).json({ message: "Currently No User Found", status: 404 });

    const match = await comparePassword(data.password, user.password);
    if (!match)
      return res
        .status(400)
        .json({ message: "Invalid credentials", status: 400 });

    const accessToken = generateAccessToken({ id:  String(user._id), role: user.role });

    let refreshToken = await redisClient.get(`refresh-token:${user._id}`);

    if (!refreshToken) {
      refreshToken = generateRefreshToken({ id:  String(user._id), role: user.role });

      await redisClient.set(`refresh-token:${user._id}`, refreshToken, {
        EX: 7 * 24 * 60 * 60,
      });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: "Login successful",
      status: 200,
    });
  } catch (err: any) {
    res
      .status(400)
      .json({ message: err.message || "Invalid data", status: 400 });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token)
    return res
      .status(400)
      .json({ message: "Refresh token required", status: 400 });

  try {
    const redisClient = getRedis();
    const decoded: any = verifyRefreshToken(token);

    const storedToken = await redisClient.get(`refresh-token:${decoded.id}`);
    if (!storedToken || storedToken !== token) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token", status: 403 });
    }

    const accessToken = generateAccessToken({
      id: decoded.id,
      role: decoded.role,
    });

    res.json({
      accessToken,
      status: 200,
      message: "Access token refreshed successfully",
    });
  } catch (err: any) {
    res
      .status(403)
      .json({ message: err.message || "Invalid refresh token", status: 403 });
  }
};



