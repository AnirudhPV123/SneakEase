import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema(
  {
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      index: true,
    },
    mainImage: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: true,
      validate: [arrayMinLength, '{PATH} must have at least one element'],
    },
    colours: {
      type: [String],
      required: true,
      validate: [arrayMinLength, '{PATH} must have at least one element'],
    },
    size: {
      type: [String],
      required: true,
      validate: [arrayMinLength, '{PATH} must have at least one element'],
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

function arrayMinLength(val) {
  return val.length > 0;
}

export const Product = mongoose.model('Product', productSchema);
