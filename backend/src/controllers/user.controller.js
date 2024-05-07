import { User } from '../models/user.model.js';
import { asyncErrorHandler } from '../utils/asyncErrorHandler.js';
import { CustomError } from '../utils/CustomError.js';
import { CustomResponse } from '../utils/CustomResponse.js';
import mongoose from 'mongoose';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

// @DESC Validating required fields (address)
const validateRequiredFields = (data) => {
  const { country, state, city, place, pincode, landmark, houseName } = data;
  if (!country || !state || !city || !place || !pincode || !landmark || !houseName) {
    return next(
      new CustomError(
        400,
        'Missing Required Fields: Please provide values for all required fields.',
      ),
    );
  }
  return 0;
};

// @DESC Helper function to determine authentication provider
// @RETURN provider
const determineAuthProvider = (authProviders) => {
  if (authProviders?.email) return 'email';
  if (authProviders?.phone) return 'phone';
  if (authProviders?.google) return 'google';
  if (authProviders?.facebook) return 'facebook';
  if (authProviders?.github) return 'github';
  return null;
};

// @DESC Update user profile (displayName)
// METHOD post
// @PATH /user/update-profile
export const updateUserProfile = asyncErrorHandler(async (req, res, next) => {
  const { displayName } = req.body;

  const updateFields = {};

  const provider = determineAuthProvider(req.user.authProviders);

  if (provider) {
    updateFields[`authProviders.${provider}.displayName`] = displayName;
  }

  await User.findByIdAndUpdate(req.user._id, updateFields);

  const providerField = provider === 'phone' ? 'phoneNumber' : 'email';

  // Aggregate query to fetch user details
  const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $project: {
        // Display Name field, fallback to an empty string if not available
        displayName: { $ifNull: [`$authProviders.${provider}.displayName`, ''] },
        // The specific provider used (email, phone, etc.)
        [provider]: { $ifNull: [`$authProviders.${provider}.${providerField}`, ''] },
        provider: provider,
        // Avatar URL field, fallback to an empty string if not available
        avatar: { $ifNull: [`$authProviders.${provider}.avatar`, ''] },
      },
    },
  ]);

  res.status(200).json(new CustomResponse(200, user[0], 'User profile updated successfully'));
});

// @DESC Add or update user address
// @METHOD post
// @PATH /user/add-address , /user/update-address
export const addOrUpdateUserAddress = asyncErrorHandler(async (req, res, next) => {
  const { country, state, city, place, pincode, landmark, houseName, addressId } = req.body;

  validateRequiredFields(req.body);

  const existingAddress = await User.findOne({ _id: req.user._id, 'addresses._id': addressId });

  // Prepare the updateFields based on whether the addressId exists
  let updateFields = {};
  if (existingAddress) {
    // If the addressId exists, update the existing address
    updateFields = {
      $set: {
        'addresses.$.country': country,
        'addresses.$.state': state,
        'addresses.$.city': city,
        'addresses.$.place': place,
        'addresses.$.pincode': pincode,
        'addresses.$.landmark': landmark,
        'addresses.$.houseName': houseName,
      },
    };
  } else {
    // If the addressId does not exist, add a new address
    updateFields = {
      $push: {
        addresses: {
          country,
          state,
          city,
          place,
          pincode,
          landmark,
          houseName,
        },
      },
    };
  }

  // Construct the query based on whether an existingAddress exist or not
  const query = existingAddress
    ? { _id: req.user._id, 'addresses._id': addressId }
    : { _id: req.user._id };

  const user = await User.findOneAndUpdate(query, updateFields, { new: true }).select(
    '-authProviders -refreshToken',
  );

  res.status(200).json(new CustomResponse(200, user, 'User address added or updated successfully'));
});

// @DESC Add or update user avatar
// @METHOD patch
// @PATH /user/avatar
export const addOrUpdateUserAvatar = asyncErrorHandler(async (req, res, next) => {
  // Retrieve the local path of the uploaded avatar file from the request
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    return next(new CustomError(400, 'Missing required fields.'));
  }

  // Upload the avatar image to the cloudinary service
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    next(new CustomError(400, 'Error while uploading avatar'));
  }

  const updateFields = {};

  const provider = determineAuthProvider(req.user.authProviders);

  // If an authentication provider is found, set the avatar URL in the update fields
  if (provider) {
    updateFields[`authProviders.${provider}.avatar`] = avatar?.url;
  }

  // Update the user document with the new avatar URL
  await User.findByIdAndUpdate(req.user._id, { $set: updateFields });

  const providerField = provider === 'phone' ? 'phoneNumber' : 'email';

  // Aggregate query to fetch user details
  const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $project: {
        // Display Name field, fallback to an empty string if not available
        displayName: { $ifNull: [`$authProviders.${provider}.displayName`, ''] },
        // The specific provider used (email, phone, etc.)
        [provider]: { $ifNull: [`$authProviders.${provider}.${providerField}`, ''] },
        provider: provider,
        // Avatar URL field, fallback to an empty string if not available
        avatar: { $ifNull: [`$authProviders.${provider}.avatar`, ''] },
      },
    },
  ]);

  res.status(201).json(new CustomResponse(201, user[0], 'User avatar updated successfully'));
});

// @DESC Get user profile
// @METHOD get
// @PATH /user/profile
export const getUserProfile = asyncErrorHandler(async (req, res, next) => {
  const provider = determineAuthProvider(req.user.authProviders);

  // Determine the field name based on the authentication provider (phone or email)
  const providerField = provider === 'phone' ? 'phoneNumber' : 'email';

  // Aggregate query to fetch user details
  const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $project: {
        // Display Name field, fallback to an empty string if not available
        displayName: { $ifNull: [`$authProviders.${provider}.displayName`, ''] },
        // The specific provider used (email, phone, etc.)
        [provider]: { $ifNull: [`$authProviders.${provider}.${providerField}`, ''] },
        provider: provider,
        // Avatar URL field, fallback to an empty string if not available
        avatar: { $ifNull: [`$authProviders.${provider}.avatar`, ''] },
        // Include the addresses array
        addresses: 1,
      },
    },
  ]);

  res.status(200).json(new CustomResponse(200, user, 'User details fetched successfully'));
});
