import { Request, Response } from "express";
import User from "../models/user.model";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { getRedis } from "../config/redis";
import { loginSchema, registerSchema, verifyLoginOtpSchema, resendOtpSchema } from "../validation/schemas";
import { maskToken } from "../utils/maskToken";
import { error } from "console";
import crypto from "crypto";
import { sendVerificationEmail, sendLoginOtpEmail } from "../utils/email";





const verifyAdminCode = async (code: any, email: any) => {

  const redisClient = getRedis();
  const storedCode = await redisClient.get(`admin-code:${email}`);
  if (!storedCode || storedCode !== code) {
    return false;
  }
  return true;

};





export const register = async (req: Request, res: Response) => {
  try {
    const redisClient = getRedis();
    const data = registerSchema.parse(req.body);

    const existing = await User.findOne({ email: data.email });
    if (existing)
      return res
        .status(400)
        .json({ message: "Email already in use", status: 400 });

    let roleToAssign;
    const totalUsers = await User.countDocuments();
    if (totalUsers === 0 && data.email === process.env.VERIFICATION_RECEIVER_EMAIL as string) {
      const code = crypto.randomInt(100000, 999999).toString();
      await redisClient.set(`admin-code:${data.email}`, code, { EX: 10 * 60 });
      await sendVerificationEmail(code);

      const isVerified = verifyAdminCode(code, data.email);
      if (!isVerified) {
        return res
          .status(400)
          .json({ message: "Admin code verification failed", status: 400 });
      }

      roleToAssign = "admin";
      await redisClient.del(`admin-code:${data.email}`);

    } else {
      if (data.role === "admin") {
        return res
          .status(403)
          .json({
            message: "Admin Role is not allowed during registration",
            status: 403,
          });
      }
      roleToAssign = data.role;
    }

    const hashed = await hashPassword(data.password);
    const user = await User.create({
      ...data,
      role: roleToAssign,
      password: hashed,
    });

    const existingRefreshToken = await redisClient.get(
      `refresh-token:${user._id}`
    );
    if (existingRefreshToken) {
      await redisClient.del(`refresh-token:${user._id}`);
    }

    const accessToken = generateAccessToken({
      id: String(user._id),
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      id: String(user._id),
      role: user.role,
    });

    await redisClient.set(`refresh-token:${user._id}`, refreshToken, {
      EX: 2 * 24 * 60 * 60,
    });

    await redisClient.set(`access-token:${user._id}`, accessToken, {
      EX: 240 * 60,
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        approved: user.approved,
        blocked: user.blocked,
      },
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: `${user.role.toUpperCase()} registered successfully`,
      status: 201,
    });
  } catch (err: any) {
    res
      .status(400)
      .json({ message: err.message || "Invalid data", status: 400 });
  }
};

export const login = async (req: Request, res: Response) => {
  console.log("[LOGIN_CONTROLLER] Login attempt for:", req.body.email);
  console.log("[LOGIN_CONTROLLER] Environment:", process.env.NODE_ENV);

  try {
    const redisClient = getRedis();
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });
    if (!user) {
      console.log("[LOGIN_CONTROLLER] User not found:", data.email);
      return res
        .status(404)
        .json({ message: "Currently No User Found", status: 404 });
    }

    const match = await comparePassword(data.password, user.password as string);
    if (!match) {
      console.log("[LOGIN_CONTROLLER] Invalid password for:", data.email);
      return res
        .status(400)
        .json({ message: "Invalid credentials", status: 400 });
    }

    console.log("[LOGIN_CONTROLLER] Credentials verified, generating OTP...");
    const otp = crypto.randomInt(100000, 999999).toString();
    user.loginOtp = otp;
    user.loginOtpExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    await user.save();
    console.log("[LOGIN_CONTROLLER] OTP saved to database");

    // Send email with comprehensive error handling
    try {
      console.log("[LOGIN_CONTROLLER] Attempting to send OTP email...");
      await sendLoginOtpEmail(user.email, otp);
      console.log("[LOGIN_CONTROLLER] ✅ OTP email sent successfully");

      res.json({
        message: "OTP sent to your email",
        status: 200,
        requiresOtp: true
      });
    } catch (emailError: any) {
      console.error("[LOGIN_CONTROLLER] ❌ Email sending failed:", {
        error: emailError.message,
        code: emailError.code,
        user: user.email
      });

      // Clear the OTP since email failed
      user.loginOtp = undefined;
      user.loginOtpExpires = undefined;
      await user.save();

      return res.status(500).json({
        message: "Failed to send OTP email. Please try again or contact support.",
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined,
        status: 500
      });
    }
  } catch (err: any) {
    console.error("[LOGIN_CONTROLLER] Unexpected error:", {
      message: err.message,
      stack: err.stack
    });
    res
      .status(400)
      .json({ message: err.message || "Invalid data", status: 400 });
  }
};




export const googleCallback = async (req: any, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }

    // ✅ Check if user email is admin email - prevent OAuth login for admins
    const adminEmail = process.env.VERIFICATION_RECEIVER_EMAIL || "bibektotol@gmail.com";
    if (user.email === adminEmail) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(
          "Admin accounts cannot use Google sign-in. Please use email and password login."
        )}`
      );
    }

    // ✅ Decode role from state parameter
    let role: "rider" | "driver" = "rider";

    if (req.query.state) {
      try {
        // Decode base64 state parameter
        const decodedState = Buffer.from(req.query.state as string, 'base64').toString('utf-8');
        const parsed = JSON.parse(decodedState);

        const parsedRole = parsed.role;

        // Validate that the role is one of the allowed values
        if (parsedRole === "rider" || parsedRole === "driver") {
          role = parsedRole;
        }
      } catch (err) {
        // If state decoding fails, use default role
        console.warn("Could not decode state parameter, using default role:", err);
        role = "rider";
      }
    }




    user.role = role;
    await user.save();

    const userId = String(user._id);

    const accessToken = generateAccessToken({ id: userId, role: user.role });
    const refreshToken = generateRefreshToken({ id: userId, role: user.role });

    const redis = getRedis();
    await redis.set(`refresh-token:${userId}`, refreshToken, { EX: 2 * 24 * 60 * 60 });
    await redis.set(`access-token:${userId}`, accessToken, { EX: 240 * 60 });


    const userPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approved: user.approved,
      blocked: user.blocked,
    };

    const redirectUrl =
      `${process.env.FRONTEND_URL}/oauth-success` +
      `?accessToken=${accessToken}` +
      `&refreshToken=${refreshToken}` +
      `&user=${encodeURIComponent(JSON.stringify(userPayload))}`;

    res.redirect(redirectUrl);

  } catch (error) {
    console.error(error);
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};



export const refreshToken = async (req: Request, res: Response) => {
  const { refreshtoken } = req.body;

  if (!refreshtoken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    const decoded: any = verifyRefreshToken(refreshtoken);
    const redisClient = getRedis();

    let storedToken;
    try {
      storedToken = await redisClient.get(`refresh-token:${decoded.id}`);
    } catch (redisErr) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: redisErr });
    }

    if (!storedToken || storedToken !== refreshtoken) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }

    let accessToken = await redisClient.get(`access-token:${decoded.id}`);

    if (!accessToken) {
      accessToken = generateAccessToken({ id: decoded.id, role: decoded.role });
      await redisClient.set(`access-token:${decoded.id}`, accessToken, {
        EX: 240 * 60,
      });
    }

    const newRefreshToken = generateRefreshToken({
      id: decoded.id,
      role: decoded.role,
    });
    await redisClient.set(`refresh-token:${decoded.id}`, newRefreshToken, {
      EX: 2 * 24 * 60 * 60,
    });

    return res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
      message: "Token refreshed successfully",
    });
  } catch (err: any) {
    return res
      .status(403)
      .json({ message: err.message || "Invalid refresh token" });
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

export const verifyLoginOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = verifyLoginOtpSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", status: 404 });
    }

    if (!user.loginOtp || !user.loginOtpExpires || user.loginOtpExpires < new Date()) {
      return res.status(400).json({ message: "OTP expired or not found", status: 400 });
    }

    if (user.loginOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP", status: 400 });
    }

    // Clear OTP
    user.loginOtp = undefined;
    user.loginOtpExpires = undefined;
    await user.save();

    const redisClient = getRedis();
    const accessToken = generateAccessToken({ id: String(user._id), role: user.role });
    const refreshToken = generateRefreshToken({ id: String(user._id), role: user.role });

    await redisClient.set(`refresh-token:${user._id}`, refreshToken, { EX: 2 * 24 * 60 * 60 });
    await redisClient.set(`access-token:${user._id}`, accessToken, { EX: 240 * 60 });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        approved: user.approved,
        blocked: user.blocked,
      },
      accessToken,
      refreshToken,
      message: "Login successful",
      status: 200,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Internal server error", status: 500 });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  console.log("[RESEND_OTP] Resend OTP request");

  try {
    const { email } = resendOtpSchema.parse(req.body);
    console.log("[RESEND_OTP] Email:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("[RESEND_OTP] User not found:", email);
      return res.status(404).json({ message: "User not found", status: 404 });
    }

    console.log("[RESEND_OTP] Generating new OTP...");
    const otp = crypto.randomInt(100000, 999999).toString();
    user.loginOtp = otp;
    user.loginOtpExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    await user.save();
    console.log("[RESEND_OTP] OTP saved to database");

    // Send email with comprehensive error handling
    try {
      console.log("[RESEND_OTP] Attempting to send OTP email...");
      await sendLoginOtpEmail(user.email, otp);
      console.log("[RESEND_OTP] ✅ OTP email sent successfully");

      res.json({ message: "OTP resent successfully", status: 200 });
    } catch (emailError: any) {
      console.error("[RESEND_OTP] ❌ Email sending failed:", {
        error: emailError.message,
        code: emailError.code,
        user: user.email
      });

      // Clear the OTP since email failed
      user.loginOtp = undefined;
      user.loginOtpExpires = undefined;
      await user.save();

      return res.status(500).json({
        message: "Failed to resend OTP email. Please try again or contact support.",
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined,
        status: 500
      });
    }
  } catch (err: any) {
    console.error("[RESEND_OTP] Unexpected error:", {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ message: err.message || "Internal server error", status: 500 });
  }
};
