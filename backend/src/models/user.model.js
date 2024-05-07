import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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

// Define schema for email/password authentication
const emailPasswordSchema = new Schema({
  displayName: { type: String },
  email: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), // Email validation regex
      message: 'Invalid email address',
    },
  },
  password: { type: String },
  avatar: { type: String },
  isActive: { type: Boolean },
  otp: { type: Number }, 
  otpExpiration: { type: String },
});

// Define schema for email/password authentication
const phoneNumberPasswordSchema = new Schema({
  displayName: { type: String },
  phoneNumber: { type: String },
  password: { type: String },
  avatar: { type: String },
  isActive: { type: Boolean },
  otp: { type: Number },
  otpExpiration: { type: String },
});

// Define a common authentication schema for google, facebook, github
const authenticationSchema = new Schema({
  displayName: { type: String },
  providerId: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  avatar: { type: String },
});

// Define the main user schema
const userSchema = new Schema(
  {
    addresses: [addressSchema],
    refreshToken: { type: String },
    authProviders: {
      google: authenticationSchema,
      facebook: authenticationSchema,
      github: authenticationSchema,
      email: emailPasswordSchema,
      phone: phoneNumberPasswordSchema,
    },
  },
  { timestamps: true },
);

// Catch email validation error
userSchema.post('validate', function (error, doc, next) {
  if (error.name === 'ValidationError' && error.errors['authProviders.email.email']) {
    next(new CustomError(400, 'Invalid email address'));
  } else {
    next(error);
  }
});

// password bcrypt
userSchema.pre('save', async function (next) {
  const provider = this.authProviders
    ? this.authProviders.email
      ? 'email'
      : this.authProviders.phone
        ? 'phone'
        : null
    : null;

  if (
    !provider ||
    !this.authProviders[provider] ||
    !this.authProviders[provider].password ||
    !this.isModified('authProviders.' + provider + '.password')
  ) {
    return next();
  }

  try {
    this.authProviders[provider].password = await bcrypt.hash(
      this.authProviders[provider].password,
      10,
    );
    return next();
  } catch (error) {
    return next(error);
  }
});

// check password correct
userSchema.methods.isPasswordCorrect = async function (password, provider) {
  return await bcrypt.compare(password, this.authProviders[provider].password);
};

// generate access token
userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

// generate refresh token
userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET_KEY,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
  );
};

export const User = mongoose.model('User', userSchema);
