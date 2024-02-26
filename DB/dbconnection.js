import mongoose from 'mongoose';

export const dbConnection = async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_NAME });
    console.log('Connected to MongoDB successfully!');
  } catch (error) {
    console.log('MongoDB Connection failed: ' + error);
  }
};
