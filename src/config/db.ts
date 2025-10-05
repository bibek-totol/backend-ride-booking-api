import mongoose from 'mongoose';


const connectDB = async () => {
const uri = process.env.MONGO_URI || '';
await mongoose.connect(uri, { autoIndex: true });
console.log('MongoDB connected');
};


export default connectDB;