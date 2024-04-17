import mongoose, { Schema } from 'mongoose';

const { ObjectId } = Schema.Types;

const cartSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    productId: [
      {
        type: ObjectId,
        ref: 'Product',
        required: true,
      },
    ],
  },
  { timestamps: true },
);

export const Cart = mongoose.model('Cart', cartSchema);
