import { Request, Response } from 'express';
import User, { Role } from '../models/user.model';
import Ride from '../models/ride.model';
import { Types } from 'mongoose';

export const listUsers = async (req: Request, res: Response) => {
  try {
    
    const users = await User.find()
      .select('-password') 
      .sort({ createdAt: -1 }); 

    
    res.json({
      users,
      total: users.length,
      status: 200,
      message: 'Users fetched successfully',
    });
  } catch (err: any) {
    res.status(400).json({
      message: err.message || 'Could not list users',
      status: 400,
    });
  }
};

export const listDrivers = async (req: Request, res: Response) => {
  try {
  
    const drivers = await User.find({ role: 'driver' })
      .select('-password') 
      .sort({ createdAt: -1 }); 

    res.json({
      drivers,
      total: drivers.length,
      status: 200,
      message: 'All drivers fetched successfully',
    });
  } catch (err: any) {
    res.status(400).json({
      message: err.message || 'Could not list drivers',
      status: 400,
    });
  }
};

export const listRides = async (req: Request, res: Response) => {
  try {
    
    const rides = await Ride.find()
      .populate('rider', 'name email')  
      .populate('driver', 'name email') 
      .sort({ createdAt: -1 });         

    res.json({
      rides,
      total: rides.length,
      status: 200,
      message: 'Rides fetched successfully',
    });
  } catch (err: any) {
    res.status(400).json({
      message: err.message || 'Could not list rides',
      status: 400,
    });
  }
};

export const approveDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id', status: 400 });

    const driver = await User.findById(id);
    if (!driver) return res.status(404).json({ message: 'Driver not found', status: 404 });
    if (driver.role !== 'driver') return res.status(400).json({ message: 'User is not a driver', status: 400 });

    driver.approved = true;
    await driver.save();

    res.json({ driver: { id: driver._id, name: driver.name, email: driver.email, approved: driver.approved }, status: 200, message: 'Driver approved' });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Could not approve driver', status: 400 });
  }
};

export const suspendDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id', status: 400 });

    const driver = await User.findById(id);
    if (!driver) return res.status(404).json({ message: 'Driver not found', status: 404 });
    if (driver.role !== 'driver') return res.status(400).json({ message: 'User is not a driver', status: 400 });

    driver.approved = false;
    await driver.save();

    res.json({ driver: { id: driver._id, name: driver.name, email: driver.email, approved: driver.approved }, status: 200, message: 'Driver suspended' });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Could not suspend driver', status: 400 });
  }
};

export const blockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id', status: 400 });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found', status: 404 });

    user.blocked = true;
    await user.save();

    res.json({ user: { id: user._id, name: user.name, email: user.email, blocked: user.blocked }, status: 200, message: 'User blocked' });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Could not block user', status: 400 });
  }
};

export const unblockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id', status: 400 });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found', status: 404 });

    user.blocked = false;
    await user.save();

    res.json({ user: { id: user._id, name: user.name, email: user.email, blocked: user.blocked }, status: 200, message: 'User unblocked' });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Could not unblock user', status: 400 });
  }
};

export const generateReport = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query as any;
    const filter: any = {};
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);

    const totalRides = await Ride.countDocuments(filter);
    const completedRides = await Ride.countDocuments({ ...filter, status: 'completed' });
    const cancelledRides = await Ride.countDocuments({ ...filter, status: 'cancelled' });

    
    const earnings = await Ride.aggregate([
      { $match: { ...filter, status: 'completed', driver: { $ne: null } } },
      { $group: { _id: '$driver', totalFare: { $sum: '$fare' }, rides: { $sum: 1 } } },
      { $sort: { totalFare: -1 } }
    ]);

    res.json({ report: { totalRides, completedRides, cancelledRides, earnings }, status: 200 });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Could not generate report', status: 400 });
  }
};


