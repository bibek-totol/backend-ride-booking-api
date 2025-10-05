import { Schema, model, Document, Types } from 'mongoose';


export type RideStatus = 'requested' | 'accepted' | 'rejected' | 'cancelled' | 'picked_up' | 'in_transit' | 'completed';


export interface IRideHistory {
status: RideStatus;
at: Date;
by?: Types.ObjectId;
note?: string;
}


export interface IRide extends Document {
rider: Types.ObjectId;
driver?: Types.ObjectId | null;
pickup: { lat: number; lng: number; address?: string };
destination: { lat: number; lng: number; address?: string };
status: RideStatus;
fare?: number;
history: IRideHistory[];
cancelledAt?: Date;
}


const rideHistorySchema = new Schema<IRideHistory>({
status: { type: String, required: true },
at: { type: Date, default: Date.now },
by: { type: Schema.Types.ObjectId, ref: 'User' },
note: String
});


const rideSchema = new Schema<IRide>({
rider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
driver: { type: Schema.Types.ObjectId, ref: 'User', default: null },
pickup: { lat: Number, lng: Number, address: String },
destination: { lat: Number, lng: Number, address: String },
status: { type: String, default: 'requested' },
fare: Number,
history: [rideHistorySchema],
cancelledAt: Date
}, { timestamps: true });


export default model<IRide>('Ride', rideSchema);