import { Schema, model, Document, Types } from 'mongoose';

export interface IEarning extends Document {
	driver: Types.ObjectId;
	ride: Types.ObjectId;
	amount: number;
	description?: string;
	createdAt?: Date;
}

const earningSchema = new Schema<IEarning>(
	{
		driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		ride: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
		amount: { type: Number, required: true },
		description: String,
	},
	{ timestamps: true }
);

export default model<IEarning>('Earning', earningSchema);
