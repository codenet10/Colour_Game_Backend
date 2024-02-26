import mongoose from 'mongoose';

export const Slider = mongoose.model(
  'Slider',
  new mongoose.Schema({
    sliderCount: { type: Number },
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
