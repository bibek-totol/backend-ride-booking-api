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

// Fetch a single ride with role-based access (admin/rider/driver)
export const getRide = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: 'Unauthorized', status: 401 });

    const { id } = req.params;
    const ride = await Ride.findById(id).populate('rider', 'name email').populate('driver', 'name email');
    if (!ride) return res.status(404).json({ message: 'Ride not found', status: 404 });

    if (userRole === 'admin') return res.json({ ride, status: 200, message: 'Ride fetched' });

    if (userRole === 'rider') {
      if (ride.rider.toString() !== userId) return res.status(403).json({ message: 'Forbidden', status: 403 });
      return res.json({ ride, status: 200, message: 'Ride fetched' });
    }

    if (userRole === 'driver') {
      if (!ride.driver) return res.status(403).json({ message: 'Forbidden', status: 403 });
      const driverId = (ride.driver as any)._id ? (ride.driver as any)._id.toString() : ride.driver.toString();
      if (driverId !== userId) return res.status(403).json({ message: 'Forbidden', status: 403 });
      return res.json({ ride, status: 200, message: 'Ride fetched' });
    }

    return res.status(403).json({ message: 'Forbidden', status: 403 });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
  }
};


export const getRides = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: 'Unauthorized', status: 401 });

    let rides;
    if (userRole === 'admin') {
      rides = await Ride.find().sort({ createdAt: -1 }).populate('rider', 'name email').populate('driver', 'name email');
    } else if (userRole === 'driver') {
      rides = await Ride.find({ driver: userId }).sort({ createdAt: -1 }).populate('rider', 'name email').populate('driver', 'name email');
    } else {
      rides = await Ride.find({ rider: userId }).sort({ createdAt: -1 }).populate('rider', 'name email').populate('driver', 'name email');
    }

    res.json({ rides, status: 200, message: 'Rides fetched' });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
  }
};


