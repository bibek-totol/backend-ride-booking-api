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


