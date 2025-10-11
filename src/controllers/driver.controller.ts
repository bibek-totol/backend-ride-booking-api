import { Request, Response } from 'express';
import Ride from '../models/ride.model';
import Earning from '../models/earning.model';
import { Types } from 'mongoose';


export const acceptRide = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      return res.status(401).json({ message: 'Unauthorized', status: 401 });
    }

    const { id: rideId } = req.params;

    
    if (!Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ message: 'Invalid ride ID format', status: 400 });
    }

    const rideObjectId = new Types.ObjectId(rideId);
    const driverObjectId = new Types.ObjectId(driverId);

   

    const updatedRide = await Ride.findOneAndUpdate(
      { rider: rideObjectId, status: 'requested' },
      {
        $set: {
          status: 'accepted',
          driver: driverObjectId,
        },
        $push: {
          history: { status: 'accepted', at: new Date(), by: driverObjectId },
        },
      },
      { new: true }
    );

    if (!updatedRide) {
      return res.status(400).json({ message: 'Ride cannot be accepted or already taken', status: 400 });
    }

    return res.status(200).json({ ride: updatedRide, message: 'Ride accepted', status: 200 });
  } catch (err: any) {
    return res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
  }
};



export const rejectRide = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      return res.status(401).json({ message: 'Unauthorized', status: 401 });
    }

    const { id: rideId } = req.params;

    
    if (!Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ message: 'Invalid ride ID format', status: 400 });
    }

    const rideObjectId = new Types.ObjectId(rideId);
    const driverObjectId = new Types.ObjectId(driverId);

   
    const updatedRide = await Ride.findOneAndUpdate(
      { rider: rideObjectId, status: 'requested' },
      {
        $set: {
          status: 'rejected',
        },
        $push: {
          history: { status: 'rejected', at: new Date(), by: driverObjectId },
        },
      },
      { new: true }
    );

    if (!updatedRide) {
      return res.status(400).json({ message: 'Ride cannot be rejected or already updated', status: 400 });
    }

    return res.status(200).json({ ride: updatedRide, message: 'Ride rejected', status: 200 });
  } catch (err: any) {
    return res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
  }
};


export const updateRideStatus = async (req: Request, res: Response) => {
	try {
		const driverId = req.user?.id;

		if (!driverId) return res.status(401).json({ message: 'Unauthorized', status: 401 });

		const { id } = req.params;
		const rideObjectId = new Types.ObjectId(id);
		const { status } = req.body as { status?: string };
		if (!status || !['picked_up', 'in_transit', 'completed'].includes(status)) {
			return res.status(400).json({ message: 'Invalid status', status: 400 });
		}

		const ride = await Ride.findOne({ rider: rideObjectId });
		if (!ride) return res.status(404).json({ message: 'Ride not found', status: 404 });
		if (!ride.driver || ride.driver.toString() !== driverId) return res.status(403).json({ message: 'Forbidden', status: 403 });

		ride.status = status as any;
		ride.history.push({ status: status as any, at: new Date(), by: new Types.ObjectId(driverId) });

		
		if (status === 'completed') {
			
			const amount = ride.fare ?? 0;
			const earning = await Earning.create({ driver: new Types.ObjectId(driverId), ride: ride._id, amount, description: 'Ride fare' });
	
			await ride.save();
			return res.json({ ride, earning, message: 'Ride completed', status: 200 });
		}

		await ride.save();
		res.json({ ride, message: 'Ride updated', status: 200 });
	} catch (err: any) {
		res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
	}
};

export const setAvailability = async (req: Request, res: Response) => {
	try {
		const driverId = req.user?.id;
		if (!driverId) return res.status(401).json({ message: 'Unauthorized', status: 401 });

		const { available } = req.body as { available?: boolean };
		if (typeof available !== 'boolean') return res.status(400).json({ message: 'available boolean required', status: 400 });

		
		res.json({ available, message: `Driver availability set to ${available ? 'online' : 'offline'}`, status: 200 });
	} catch (err: any) {
		res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
	}
};

export const getEarningsHistory = async (req: Request, res: Response) => {
	try {
		const driverId = req.user?.id;
		if (!driverId) return res.status(401).json({ message: 'Unauthorized', status: 401 });

		const earnings = await Earning.find({ driver: driverId }).sort({ createdAt: -1 });
		res.json({ earnings, status: 200 });
	} catch (err: any) {
		res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
	}
};


