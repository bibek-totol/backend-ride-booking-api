import { Request, Response } from 'express';
import User from '../models/user.model';
import Ride from '../models/ride.model';
import { Types } from 'mongoose';


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


