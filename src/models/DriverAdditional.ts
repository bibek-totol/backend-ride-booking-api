import mongoose, { Schema, Document } from "mongoose";

export interface IDriverAdditional extends Document {
  user: mongoose.Types.ObjectId;   
  role: string;                   
  phone: string;
  address: string;
  nid: string;
  license: string;
  vehicleRegNo: string;
  vehicleType: string;
  vehicleModel: string;
  experience: string;
  licenseImg: string;
  regCertImg: string;
}

const DriverAdditionalSchema = new Schema<IDriverAdditional>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true },

  phone: { type: String, required: true },
  address: { type: String, required: true },
  nid: { type: String, required: true },
  license: { type: String, required: true },

  vehicleRegNo: { type: String, required: true },
  vehicleType: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  experience: { type: String, required: true },

  licenseImg: { type: String, required: true },
  regCertImg: { type: String, required: true },
},{ timestamps:true });

export default mongoose.model("DriverAdditional", DriverAdditionalSchema);
