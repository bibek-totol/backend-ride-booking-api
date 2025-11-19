import { Request, Response } from 'express';
import User from '../models/user.model';
import Ride from '../models/ride.model';
import { Types } from 'mongoose';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized', status: 401 });

    const user = await User.findById(userId).select('name email role createdAt');
    if (!user) return res.status(404).json({ message: 'User not found', status: 404 });

    res.json({ user, status: 200, message: 'Profile fetched' });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
  }
};




export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID", status: 400 });
    }

    const user = await User.findById(userId).select("name email");
    if (!user) return res.status(404).json({ message: "User not found", status: 404 });

    res.json({ user, status: 200 });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Invalid request", status: 400 });
  }
};



export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, email, role } = req.body;

    
    if (!name || !email || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!["rider", "driver"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, role },
      { new: true }
    ).select("-password");

    return res.json(updatedUser);
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};






export const sendPasswordOtp = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

  
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

    
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires = expiresAt;
    await user.save();

    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),  
     secure: true,      
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });


    transporter.verify((err, success) => {
  if (err) console.log("SMTP Error:", err);
  else console.log("SMTP Connected");
});

    await transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Change OTP',
      text: `Your OTP for password change is: ${otp}. It expires in 5 minutes.`,
    });

    return res.json({ message: 'OTP sent to your email' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};


export const verifyPasswordOtp = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { otp } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.passwordResetOtp || !user.passwordResetOtpExpires) {
      return res.status(400).json({ message: 'No OTP found. Please request again.' });
    }

    if (new Date() > user.passwordResetOtpExpires) {
      user.passwordResetOtp = undefined;
      user.passwordResetOtpExpires = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP expired. Please request again.' });
    }

    if (user.passwordResetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

  
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    await user.save();

    return res.json({ message: 'OTP verified successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};


export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};


