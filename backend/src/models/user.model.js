import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const addressSchema = new Schema({
  country: String,
  state: String,
  city: String,
  place: String,
  pincode: Number,
  landmark: String,
  houseName: String,
});

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true, // Add index for email field
    },
    password: {
      type: String,
      required: true,
    },
    address: [addressSchema],
    image: String,
  },
  { timestamps: true },
);

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
