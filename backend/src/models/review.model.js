import mongoose, { Schema } from 'mongoose';

const { ObjectId } = Schema.Types;

const reviewSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: ObjectId,
      ref: 'Product',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export const Review = mongoose.model('Review', reviewSchema);
