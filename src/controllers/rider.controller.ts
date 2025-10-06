import { Request, Response } from 'express';
import Ride, { IRide } from '../models/ride.model';
import { requestRideSchema } from '../validation/schemas';
import { Types } from 'mongoose';



export const requestRide = async (req: Request, res: Response) => {
  try {
    const data = requestRideSchema.parse(req.body);

    const riderId = req.user?.id;
    if (!riderId) return res.status(401).json({ message: 'Unauthorized', status: 401 });

    const ride = await Ride.create({
      rider: new Types.ObjectId(riderId),
      pickup: data.pickup,
      destination: data.destination,
      status: 'requested',
      history: [{ status: 'requested', at: new Date(), by: new Types.ObjectId(riderId) }]
    } as Partial<IRide>);

    res.status(201).json({ ride, message: 'Ride requested', status: 201 });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Invalid data', status: 400 });
  }
};

export const cancelRide = async (req: Request, res: Response) => {
  try {
    const riderId = req.user?.id;
    if (!riderId) return res.status(401).json({ message: 'Unauthorized', status: 401 });

    const { id } = req.params;
    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ message: 'Ride not found', status: 404 });
    if (ride.rider.toString() !== riderId) return res.status(403).json({ message: 'Forbidden', status: 403 });

    
    if (ride.status !== 'requested') {
      return res.status(400).json({ message: 'Ride cannot be cancelled at this stage', status: 400 });
    }

    const createdAt = (ride.history?.[0]?.at ?? new Date());
    const ageMin = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
    const cancellationWindowMin = Number(process.env.CANCELLATION_WINDOW_MIN ?? 5);
    if (ageMin > cancellationWindowMin) {
      return res.status(400).json({ message: '5 Minute Cancellation Time Expired', status: 400 });
    }

    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.history.push({ status: 'cancelled', at: new Date(), by: new Types.ObjectId(riderId) });
    await ride.save();

    res.json({ ride, message: 'Ride cancelled', status: 200 });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
  }
};

export const getRide = async (req: Request, res: Response) => {
  try {
    const riderId = req.user?.id;
    if (!riderId) return res.status(401).json({ message: 'Unauthorized', status: 401 });

    const { id } = req.params;
    const ride = await Ride.findById(id).populate('driver', 'name email');
    if (!ride) return res.status(404).json({ message: 'Ride not found', status: 404 });
    if (ride.rider.toString() !== riderId) return res.status(403).json({ message: 'Forbidden', status: 403 });

    res.json({ ride, status: 200, message: 'Ride fetched' });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
  }
};

export const getRideHistory = async (req: Request, res: Response) => {
  try {
    const riderId = req.user?.id;
    if (!riderId) return res.status(401).json({ message: 'Unauthorized', status: 401 });

    const rides = await Ride.find({ rider: riderId }).sort({ createdAt: -1 });

    res.json({ rides, status: 200, message: 'Ride history fetched' });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Invalid request', status: 400 });
  }
};


