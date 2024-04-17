import mongoose, { Schema } from 'mongoose';
import logger from '../utils/logger.js';

const { ObjectId } = Schema.Types;

const orderSubSchema = new Schema(
  {
    products: [{ type: ObjectId, ref: 'Product', required: true }],
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered'], // Add validation
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// Add indexes
orderSubSchema.index({ status: 1 });
orderSubSchema.index({ 'products.productId': 1 });

const orderSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    orders: [orderSubSchema],
  },
  { timestamps: true },
);

orderSchema.post('save', function (error, doc, next) {
  if (error) {
    logger.error('Error saving document:', error);

    // Respond to the client with a generic error message
    res.status(500).json({ error: 'Internal server error' });

    return; // Stop further processing to avoid sending multiple responses
  }

  // If there is no error, continue to the next middleware or route handler
  next();
});

export const Order = mongoose.model('Order', orderSchema);
