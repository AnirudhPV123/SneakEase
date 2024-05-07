import { User } from '../models/user.model.js';
import { asyncErrorHandler } from '../utils/asyncErrorHandler.js';
import { CustomError } from '../utils/CustomError.js';
import { CustomResponse } from '../utils/CustomResponse.js';
import generateOTP from '../utils/generateOTP.js';
import sendSMS from '../utils/sendSMS.js';
import sendEmailVerification from '../utils/sendEmailVerification.js';

// @DESC generate access and refresh token
// @RETURN access and refresh token
// This function is typically called during user authentication.
const generateAccessAndRefreshToken = asyncErrorHandler(async (userId) => {
  const user = await User.findById({ _id: userId });
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
});

// @DESC login with authProviders controller (google,facebook,github)
// @CALLED FROM /config/passport.js - configuration
export const loginWithAuthProviders = asyncErrorHandler(async (profile) => {
  const { providerId, email, displayName, photos, provider } = profile;

  let user = await User.findOne({ [`authProviders.${provider}.providerId`]: providerId });

  if (!user) {
    user = await User.create({
      authProviders: {
        [provider]: {
          providerId: providerId,
          email: email,
          displayName: displayName,
          avatar: photos,
        },
      },
    });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  user = await User.aggregate([
    {
      $match: { _id: user?._id },
    },
    {
      $project: {
        displayName: `$authProviders.${provider}.displayName`,
        email: `$authProviders.${provider}.email`,
        avatar: `$authProviders.${provider}.avatar`,
      },
    },
  ]);
  user = user[0];
  user.accessToken = accessToken;
  user.refreshToken = refreshToken;
  return user;
});

// @DESC create object provider and query based on condition
// @RETURN provider and query as an object
const getProviderAndQuery = (email, phoneNumber) => {
  if (email) return ['email', { 'authProviders.email.email': email }];
  if (phoneNumber) return ['phone', { 'authProviders.phone.phoneNumber': phoneNumber }];
  return [null, null];
};

// @DESC signup with email or phone number , otp also generated
// @METHOD post
// @PATH /auth/signup
export const signupWithEmailOrPhone = asyncErrorHandler(async (req, res, next) => {
  const { displayName, email, phoneNumber, password } = req.body;
  const [provider, query] = getProviderAndQuery(email, phoneNumber);

  if (!displayName || !password || !provider) {
    return next(
      new CustomError(
        400,
        'Missing Required Fields: Please provide values for all required fields.',
      ),
    );
  }

  const existingUser = await User.findOne(query);

  if (existingUser && existingUser.authProviders[provider].isActive) {
    return next(
      new CustomError(400, `${provider === 'email' ? 'Email' : 'Phone Number'} already exists`),
    );
  } else if (existingUser) {
    await User.deleteOne({
      [provider === 'email' ? 'authProviders.email.email' : 'authProviders.phone.phoneNumber']:
        provider === 'email' ? email : phoneNumber,
    });
  }

  const { otp, otpExpiration } = generateOTP();
  const newUser = new User({
    authProviders: {
      [provider]: {
        email: provider === 'email' ? email : undefined,
        phoneNumber: provider === 'phone' ? phoneNumber : undefined,
        displayName,
        password,
        isActive: false,
        otp,
        otpExpiration,
      },
    },
  });

  await newUser.save();

  if (provider === 'email') {
    await sendEmailVerification(email, otp);
    return res
      .status(201)
      .json(
        new CustomResponse(
          201,
          'User created successfully. Please check your email for verification.',
        ),
      );
  } else {
    const message = `Your OTP for SneakEase verification is: ${otp}`;
    await sendSMS(phoneNumber, message);
    return res
      .status(201)
      .json(
        new CustomResponse(
          201,
          'User created successfully. Please check your phone for verification.',
        ),
      );
  }
});

// @DESC verify OTP  , update user DB(isActive,otp,otpExpiration)
// @RETURN access and refresh token
const verifyOTP = asyncErrorHandler(async (provider, query, otp) => {
  if (!otp || !provider) {
    throw new CustomError(
      400,
      'Missing Required Fields: Please provide values for all required fields.',
    );
  }

  const user = await User.findOne(query);

  if (!user) {
    throw new CustomError(404, 'User not found');
  }

  if (
    user.authProviders[provider].otp !== parseInt(otp) ||
    user.authProviders[provider].otpExpiration <= Date.now()
  ) {
    throw new CustomError(404, 'Invalid or expired OTP.');
  }

  user.authProviders[provider].isActive = true;
  user.authProviders[provider].otp = undefined;
  user.authProviders[provider].otpExpiration = undefined;
  await user.save();

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  return { accessToken, refreshToken };
});

// @DESC verify OTP with either email or phone number (send access and refresh token)
// @METHOD post
// @PATH /auth/verify
export const verifyOTPWithEmailOrPhone = asyncErrorHandler(async (req, res, next) => {
  const { email, phoneNumber, otp } = req.body;
  const [provider, query] = getProviderAndQuery(email, phoneNumber);

  const { accessToken, refreshToken } = await verifyOTP(provider, query, otp);

  const options = {
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('accessToken', accessToken, options).cookie('refreshToken', refreshToken, options);
  res.status(200).json(new CustomResponse(200, 'User verified successfully'));
});

// @DESC resend OTP , update user DB(otp,otpExipiration)
// @RETURN OTP
const resendOTP = asyncErrorHandler(async (provider, query) => {
  if (!provider) {
    throw new CustomError(
      400,
      'Missing Required Fields: Please provide values for all required fields.',
    );
  }

  const existingUser = await User.findOne(query);

  if (existingUser && existingUser.authProviders[provider].isActive) {
    throw new CustomError(400, `${provider === 'email' ? 'Email' : 'Phone Number'} already exists`);
  }

  const { otp, otpExpiration } = generateOTP();

  await User.findOneAndUpdate(query, {
    $set: {
      [`authProviders.${provider}.otp`]: otp,
      [`authProviders.${provider}.otpExpiration`]: otpExpiration,
    },
  });

  return otp;
});

// @DESC resend OTP with either email or phone number
// @METHOD post
// @PATH /auth/resend-top
export const resendOTPWithEmailOrPhone = asyncErrorHandler(async (req, res, next) => {
  const { email, phoneNumber } = req.body;
  const [provider, query] = getProviderAndQuery(email, phoneNumber);

  const otp = await resendOTP(provider, query);

  if (provider === 'email') {
    await sendEmailVerification(email, otp);
    return res
      .status(200)
      .json(
        new CustomResponse(
          200,
          'OTP send successfully. Please check your email (and spam folder) for the verification code.',
        ),
      );
  } else {
    const message = `Your OTP for SneakEase verification is: ${otp}`;
    await sendSMS(phoneNumber, message);
    return res
      .status(200)
      .json(
        new CustomResponse(
          200,
          'OTP resent successfully. Please check your phone for the verification code.',
        ),
      );
  }
});

// @DESC forgot password , update user DB(isActive,otp,otpExipiration)
// @RETURN OTP
const forgotPassword = asyncErrorHandler(async (provider, query) => {
  if (!provider) {
    throw new CustomError(
      400,
      'Missing Required Fields: Please provide values for all required fields.',
    );
  }

  const existingUser = await User.findOne(query);

  if (!existingUser || !existingUser.authProviders[provider].isActive) {
    throw new CustomError(400, `${provider === 'email' ? 'Email' : 'Phone Number'} not exists`);
  }

  const { otp, otpExpiration } = generateOTP();

  await User.findOneAndUpdate(query, {
    $set: {
      [`authProviders.${provider}.isActive`]: false,
      [`authProviders.${provider}.otp`]: otp,
      [`authProviders.${provider}.otpExpiration`]: otpExpiration,
    },
  });

  return otp;
});

// @DESC forgot password with either email or phone number
// @METHOD post
// @PATH /auth/forgot-password
export const forgotPasswordWithEmailOrPhone = asyncErrorHandler(async (req, res, next) => {
  const { email, phoneNumber } = req.body;
  const [provider, query] = getProviderAndQuery(email, phoneNumber);

  const otp = await forgotPassword(provider, query);

  if (provider === 'email') {
    await sendEmailVerification(email, otp);
    return res
      .status(200)
      .json(
        new CustomResponse(
          200,
          'Password reset OTP send successfully. Please check your email (and spam folder) for the verification code.',
        ),
      );
  } else {
    const message = `Your OTP for SneakEase verification is: ${otp}`;
    await sendSMS(phoneNumber, message);
    return res
      .status(200)
      .json(
        new CustomResponse(
          200,
          'Reset password OTP send successfully. Please check your phone for the verification code.',
        ),
      );
  }
});

// @DESC reset password , update user DB(isActive,otp,otpExipiration,password)
// @RETURN access and refresh token
const resetPassword = asyncErrorHandler(async ({ provider, query, otp, newPassword }) => {
  if (!otp || !newPassword || !provider) {
    throw new CustomError(
      400,
      'Missing Required Fields: Please provide values for all required fields.',
    );
  }

  const user = await User.findOne(query);

  if (!user) {
    throw new CustomError(404, 'User not found');
  }

  if (
    user.authProviders[provider].otp !== parseInt(otp) ||
    user.authProviders[provider].otpExpiration <= Date.now()
  ) {
    throw new CustomError(404, 'Invalid or expired OTP.');
  }

  user.authProviders[provider].isActive = true;
  user.authProviders[provider].otp = undefined;
  user.authProviders[provider].otpExpiration = undefined;
  user.authProviders[provider].password = newPassword;
  await user.save();

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  return { accessToken, refreshToken };
});

// @DESC reset password with either email or phone number
// @METHOD post
// @PATH /auth/reset-password
export const resetPasswordWithOTP = asyncErrorHandler(async (req, res, next) => {
  const { email, phoneNumber, otp, newPassword } = req.body;
  const [provider, query] = getProviderAndQuery(email, phoneNumber);

  console.log(newPassword);
  const { accessToken, refreshToken } = await resetPassword({ provider, query, otp, newPassword });

  const options = {
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('accessToken', accessToken, options).cookie('refreshToken', refreshToken, options);
  res.status(200).json(new CustomResponse(200, 'Password reset successfully'));
});

// @DESC login with either email or phone number
// @METHOD post
// @PATH /auth/login
export const loginWithEmailOrPhone = asyncErrorHandler(async (req, res, next) => {
  const { email, phoneNumber, password } = req.body;
  const [provider, query] = getProviderAndQuery(email, phoneNumber);

  if (!password || !provider) {
    return next(
      new CustomError(
        400,
        'Missing Required Fields: Please provide values for all required fields.',
      ),
    );
  }

  const existingUser = await User.findOne(query);

  console.log(existingUser);

  if (!existingUser || !existingUser.authProviders[provider].isActive) {
    next(new CustomError(400, `${provider === 'email' ? 'Email' : 'Phone Number'} not exists`));
  }

  const isPasswordCorrect = await existingUser.isPasswordCorrect(password, provider);

  if (!isPasswordCorrect) {
    next(new CustomError(401, 'Incorrect password.'));
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existingUser._id);

  existingUser.refreshToken = refreshToken;
  await existingUser.save();

  const options = {
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('accessToken', accessToken, options).cookie('refreshToken', refreshToken, options);
  res.status(200).json(new CustomResponse(200, 'User loggedIn successfully'));
});

// @DESC Refresh access and refresh token
// @METHOD post
// @PATH /auth/refresh-token
export const refreshAccessAndRefreshToken = asyncErrorHandler(async (req, res, next) => {
  // Extract the incoming refresh token from cookies or request body
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  // Check if the incoming refresh token is provided
  if (!incomingRefreshToken) {
    next(new CustomError(401, 'Unauthorized request'));
    return; // Ensure to exit the function after sending the error response
  }

  // Verify the incoming refresh token
  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);

  // Find the user associated with the decoded token
  const user = await User.findById(decodedToken?._id);

  if (!user) {
    next(new CustomError(401, 'Invalid refresh Token'));
    return;
  }

  // Check if the incoming refresh token matches the user's refresh token
  if (user?.refreshToken !== incomingRefreshToken) {
    next(new CustomError(401, 'Refresh token is expired'));
    return;
  }

  // Generate new access and refresh tokens
  const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(
    decodedToken._id,
  );

  // Configure options for setting cookies
  const options = {
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  // Set the new access and refresh tokens as cookies in the response headers
  res.cookie('accessToken', accessToken, options).cookie('refreshToken', newRefreshToken, options);
  // Send a success response with a custom message
  res.status(200).json(new CustomResponse(200, 'User verified successfully'));
});
