import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/CustomError.js';
import { asyncErrorHandler } from '../utils/asyncErrorHandler.js';

export const verifyJWT = asyncErrorHandler(async (req, _, next) => {
  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    next(new CustomError(401, 'Unauthorized request'));
  }

  const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);

  const user = await User.findById(decodedtoken?._id).select(
    '-authProviders.email.password -authProviders.phone.password -refreshToken -address',
  );

  if (!user) {
    next(new CustomError(401, 'Invalid Access Token'));
  }

  req.user = user;
  next();
});
       