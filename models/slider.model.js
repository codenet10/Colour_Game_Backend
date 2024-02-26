import mongoose from 'mongoose';
export const Slider = mongoose.model(
  'Slider',
  new mongoose.Schema({
    document: [
      {
        image: { type: String, required: true },
        text: { type: String, required: true },
        headingText: { type: String, required: true },
      },
    ],
  }),
  'Slider',
);
