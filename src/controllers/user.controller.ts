import { Request, Response } from 'express';
import User from '../models/user.model';
import Ride from '../models/ride.model';


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

