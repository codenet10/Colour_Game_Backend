import mongoose from 'mongoose';

export const User = new mongoose.model(
  'user',
  new mongoose.Schema({
    firstName: { type: String, required: [true, 'firstName is required'] },
    lastName: { type: String, required: [true, 'lastName is required'] },
    userName: { type: String, required: [true, 'userName is required'] },
    phoneNumber: { type: Number, required: [true, 'phoneNumber is required'] },
    password: { type: String, required: [true, 'password is required'] },
    roles: [{ type: String, required: [true, 'Roles Not Found'], default: 'User' }],
    eligibilityCheck: { type: Boolean, default: false, requird: [true, 'Check Eligibility'] },
  }),
  'user',
);
