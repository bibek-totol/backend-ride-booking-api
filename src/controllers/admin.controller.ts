import { Request, Response } from 'express';
import User, { Role } from '../models/user.model';
import Ride from '../models/ride.model';
import { Types } from 'mongoose';


const sendError = (res: Response, err: any, fallback: string) => {
  return res.status(400).json({
    status: 400,
    message: err?.message || fallback,
  });
};


const isProtectedUser = (reqUserId: string, targetUser: any) => {
  if (!targetUser) return "User not found";


  if (targetUser.role === 'admin') return "Cannot modify an ADMIN user";


  if (targetUser._id.toString() === reqUserId) return "You cannot modify your own account";

  return null;
};


export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return res.json({
      status: 200,
      message: 'Users fetched successfully',
      total: users.length,
      users,
    });
  } catch (err) {
    return sendError(res, err, 'Could not list users');
  }
};


export const listDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await User.find({ role: 'driver' })
      .select('-password')
      .sort({ createdAt: -1 });

    return res.json({
      status: 200,
      message: 'Drivers fetched successfully',
      total: drivers.length,
      drivers,
    });
  } catch (err) {
    return sendError(res, err, 'Could not list drivers');
  }
};



export const listRides = async (req: Request, res: Response) => {
  try {
    const rides = await Ride.find()
      .populate('rider', 'name email')
      .populate('driver', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      status: 200,
      message: 'Rides fetched successfully',
      total: rides.length,
      rides,
    });
  } catch (err) {
    return sendError(res, err, 'Could not list rides');
  }
};


export const approveDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid ID', status: 400 });

    const driver = await User.findById(id);
    if (!driver) return res.status(404).json({ message: 'Driver not found', status: 404 });

    if (driver.role !== 'driver')
      return res.status(400).json({ message: 'User is not a driver', status: 400 });

    driver.approved = true;
    await driver.save();

    return res.json({
      status: 200,
      message: 'Driver approved',
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        approved: driver.approved,
      },
    });
  } catch (err) {
    return sendError(res, err, 'Could not approve driver');
  }
};


export const suspendDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid ID', status: 400 });

    const driver = await User.findById(id);
    if (!driver) return res.status(404).json({ message: 'Driver not found', status: 404 });

    if (driver.role !== 'driver')
      return res.status(400).json({ message: 'User is not a driver', status: 400 });

    driver.approved = false;
    await driver.save();

    return res.json({
      status: 200,
      message: 'Driver suspended',
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        approved: driver.approved,
      },
    });
  } catch (err) {
    return sendError(res, err, 'Could not suspend driver');
  }
};


export const blockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ status: 400, message: 'Invalid ID' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ status: 404, message: 'User not found' });

    const protectionMsg = isProtectedUser(req.user!.id, user);
    if (protectionMsg) return res.status(403).json({ status: 403, message: protectionMsg });

    user.blocked = true;
    await user.save();

    return res.json({
      status: 200,
      message: 'User blocked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        blocked: user.blocked,
      },
    });
  } catch (err) {
    return sendError(res, err, 'Could not block user');
  }
};


export const unblockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ status: 400, message: 'Invalid ID' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ status: 404, message: 'User not found' });

    const protectionMsg = isProtectedUser(req.user!.id, user);
    if (protectionMsg) return res.status(403).json({ status: 403, message: protectionMsg });

    user.blocked = false;
    await user.save();

    return res.json({
      status: 200,
      message: 'User unblocked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        blocked: user.blocked,
      },
    });
  } catch (err) {
    return sendError(res, err, 'Could not unblock user');
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
      {
        $match: {
          ...filter,
          status: 'completed',
          driver: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$driver',
          totalFare: { $sum: '$fare' },
          rides: { $sum: 1 },
        },
      },
      { $sort: { totalFare: -1 } },
    ]);

    return res.json({
      status: 200,
      report: {
        totalRides,
        completedRides,
        cancelledRides,
        earnings,
      },
    });
  } catch (err) {
    return sendError(res, err, 'Could not generate report');
  }
};


export const getAllDriverEarnings = async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id; 
    
    if (!driverId) return res.status(400).json({ message: "Driver ID required" });

    const rides = await Ride.find({ driver: driverId, status: "accepted" });

    const totalRides = rides.length;
    const totalEarnings = rides.reduce((sum, ride) => sum + (ride.price || 0), 0);
    const averageFare = totalRides > 0 ? totalEarnings / totalRides : 0;

    return res.status(200).json({
      totalRides,
      totalEarnings: Math.round(totalEarnings),
      averageFare: Math.round(averageFare),
      status: 200,
    });

  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

