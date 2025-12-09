import { Request, Response } from 'express';
import User, { Role } from '../models/user.model';
import Ride from '../models/ride.model';
import { Types } from 'mongoose';
import DriverAdditional from '../models/DriverAdditional';
import nodemailer from 'nodemailer';


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



export const getAllDriversAdditional = async (req: Request, res: Response) => {
  try {
  
    const drivers = await DriverAdditional.find({}).populate("user", "name email");;

    if (!drivers || drivers.length === 0) {
      return res.status(404).json({ success: false, message: "No driver info found" });
    }

    return res.status(200).json({ success: true, data: drivers });
  } catch (error) {
    console.error("Error fetching drivers info:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
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


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


transporter.verify((err, success) => {
  if (err) console.log('SMTP Error:', err);
  else console.log('SMTP Connected');
});

// Helper to send email
const sendDriverEmail = async (email: string, subject: string, text: string) => {
  await transporter.sendMail({
    from: `"Your App" <${process.env.SMTP_USER}>`,
    to: email,
    subject,
    text,
  });
};

// Approve driver
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

    // Send approval email
    await sendDriverEmail(
      driver.email,
      'Driver Account Approved',
      `Hello ${driver.name},\n\nYour driver account has been approved. You can now start accepting rides.\n\nBest regards,\nYour App Team`
    );

    return res.json({
      status: 200,
      message: 'Driver approved and email sent',
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

    // Send suspension email
    await sendDriverEmail(
      driver.email,
      'Driver Account Suspended',
      `Hello ${driver.name},\n\nYour driver account has been suspended. You will not be able to accept rides until it is reinstated.\n\nBest regards,\nYour App Team`
    );

    return res.json({
      status: 200,
      message: 'Driver suspended and email sent',
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
      return res.status(400).json({ status: 400, message: "Invalid ID" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ status: 404, message: "User not found" });

    const protectionMsg = isProtectedUser(req.user!.id, user);
    if (protectionMsg) return res.status(403).json({ status: 403, message: protectionMsg });

    user.blocked = true;
    await user.save();

    // Send BLOCK notification email
    await sendDriverEmail(
      user.email,
      "Your Account Has Been Blocked",
      `Hello ${user.name},\n\nYour account has been blocked due to violation or admin action. Please contact support if you believe this is a mistake.\n\nBest regards,\nYour App Team`
    );

    return res.json({
      status: 200,
      message: "User blocked successfully and email sent",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        blocked: user.blocked,
      },
    });
  } catch (err) {
    return sendError(res, err, "Could not block user");
  }
};



export const unblockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ status: 400, message: "Invalid ID" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ status: 404, message: "User not found" });

    const protectionMsg = isProtectedUser(req.user!.id, user);
    if (protectionMsg) return res.status(403).json({ status: 403, message: protectionMsg });

    user.blocked = false;
    await user.save();

    // Send UNBLOCK email
    await sendDriverEmail(
      user.email,
      "Your Account Has Been Unblocked",
      `Hello ${user.name},\n\nGood news! Your account has been unblocked and restored. You can now log in and continue using our services.\n\nBest regards,\nYour App Team`
    );

    return res.json({
      status: 200,
      message: "User unblocked successfully and email sent",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        blocked: user.blocked,
      },
    });
  } catch (err) {
    return sendError(res, err, "Could not unblock user");
  }
};




export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ status: 400, message: 'Invalid ID' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ status: 404, message: 'User not found' });

    const protectionMsg = isProtectedUser(req.user!.id, user);
    if (protectionMsg) return res.status(403).json({ status: 403, message: protectionMsg });

    await user.deleteOne();

    return res.json({
      status: 200,
      message: 'User deleted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        blocked: user.blocked,
      },
    });
  } catch (err) {
    return sendError(res, err, 'Could not delete user');
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

