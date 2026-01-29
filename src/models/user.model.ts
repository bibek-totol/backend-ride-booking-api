import { Schema, model, Document } from "mongoose";

export type Role = "admin" | "rider" | "driver";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: Role;
  phone: string;
  blocked: boolean;
  approved: boolean;
  googleId?: string;
  passwordResetOtp?: string;
  passwordResetOtpExpires?: Date;
  loginOtp?: string;
  loginOtpExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true, lowercase: true },

    password: {
      type: String,
      required: function (this: any) {
        return !this.googleId;
      },
    },

    role: {
      type: String,
      enum: ["admin", "rider", "driver"],
      default: "rider",
    },

    phone: { type: String, required: true },

    blocked: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },

    googleId: { type: String },

    passwordResetOtp: { type: String },
    passwordResetOtpExpires: { type: Date },
    loginOtp: { type: String },
    loginOtpExpires: { type: Date },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
