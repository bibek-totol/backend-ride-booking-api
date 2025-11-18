import { Schema, model, Document } from 'mongoose';


export type Role = 'admin' | 'rider' | 'driver';


export interface IUser extends Document {
name: string;
email: string;
password: string;
role: Role;
blocked: boolean;
approved: boolean;
passwordResetOtp?: string;
passwordResetOtpExpires?: Date;
}


const userSchema = new Schema<IUser>({
name: { type: String, required: true },
email: { type: String, required: true, unique: true, lowercase: true },
password: { type: String, required: true },
role: { type: String, enum: ['admin','rider','driver'], default: 'rider' },
blocked: { type: Boolean, default: false },
approved: { type: Boolean, default: false },
passwordResetOtp: { type: String },
    passwordResetOtpExpires: { type: Date }
}, { timestamps: true });


export default model<IUser>('User', userSchema);