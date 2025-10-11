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
import { error } from "console";

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


    await redisClient.set(`access-token:${user._id}`, accessToken, {
      EX: 60 * 60,
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: accessToken,
      refreshToken: refreshToken,
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

   

    let refreshToken = await redisClient.get(`refresh-token:${user._id}`);
    let accessToken = await redisClient.get(`access-token:${user._id}`);
    if (!accessToken) {
      accessToken = generateAccessToken({ id:  String(user._id), role: user.role });
      await redisClient.set(`access-token:${user._id}`, accessToken, {
        EX: 60 * 60,
      });
    }

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
  const { refreshtoken } = req.body;

  if (!refreshtoken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    const decoded:any = verifyRefreshToken(refreshtoken) ;
    const redisClient = getRedis();

    let storedToken;
    try {
      storedToken = await redisClient.get(`refresh-token:${decoded.id}`);
    } catch (redisErr) {
    
      return res.status(500).json({ message: "Internal server error",error: redisErr });
    }

    if (!storedToken || storedToken !== refreshtoken) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    let accessToken = await redisClient.get(`access-token:${decoded.id}`);

    if (!accessToken) {
      accessToken = generateAccessToken({ id: decoded.id, role: decoded.role });
      await redisClient.set(`access-token:${decoded.id}`, accessToken, { EX: 60 * 60 });
    }

  
    const newRefreshToken = generateRefreshToken({ id: decoded.id, role: decoded.role });
    await redisClient.set(`refresh-token:${decoded.id}`, newRefreshToken, { EX: 7 * 24 * 60 * 60 });

    return res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
      message: "Token refreshed successfully",
    });

  } catch (err: any) {
  
    return res.status(403).json({ message: err.message || "Invalid refresh token" });
  }
};


export const logout = async (req: Request, res: Response) => {
  try {
    const redisClient = getRedis();
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: "Unauthorized", status: 401 });

    await redisClient.del(`refresh-token:${userId}`);
    await redisClient.del(`access-token:${userId}`);

    res.json({
      message: "Logout successful",
      status: 200,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: err.message || "Internal server error", status: 500 });
  }
};
