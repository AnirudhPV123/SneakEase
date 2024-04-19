import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { CustomError } from '../utils/CustomError.js';

// Define address schema
const addressSchema = new Schema({
  country: String,
  state: String,
  city: String,
  place: String,
  pincode: Number,
  landmark: String,
  houseName: String,
});

// Define user schema
const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: (value) => {
          // Regular expression for email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: 'Invalid email address',
      },
    },
    password: { type: String, required: true },
    address: [addressSchema],
    image: { type: String },
  },
  { timestamps: true },
);

// Error handling for duplicate key error (unique email constraint)
userSchema.post('save', (error, doc, next) => {
  console.log(error);
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new CustomError(401, 'Email address is already registered'));
  } else {
    next(error);
  }
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    REFRESH_TOKEN_SECRET_KEY,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
  );
};

export const User = mongoose.model('User', userSchema);
