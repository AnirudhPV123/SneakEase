import { Router } from 'express';
import {
  googleLoginController,
  googleAuthCallbackController,
  facebookLoginController,
  facebookAuthCallbackController,
  githubLoginController,
  githubAuthCallbackController,
} from '../controllers/socailMediaAuth.controller.js';
import {
  forgotPasswordWithEmailOrPhone,
  loginWithEmailOrPhone,
  refreshAccessAndRefreshToken,
  resendOTPWithEmailOrPhone,
  resetPasswordWithOTP,
  signupWithEmailOrPhone,
  verifyOTPWithEmailOrPhone,
} from '../controllers/auth.controller.js';

const router = Router();

// ** login with socialMedia accounts methods routes

// google
router.route('/google').get(googleLoginController);
router.route('/google/callback').get(googleAuthCallbackController);

// facebook
router.route('/facebook').get(facebookLoginController);
router.route('/facebook/callback').get(facebookAuthCallbackController);

// github
router.route('/github').get(githubLoginController);
router.route('/github/callback').get(githubAuthCallbackController);

// signup with either email or phone number route
router.route('/signup').post(signupWithEmailOrPhone);

// OTP verify with either email or phone number route
router.route('/verify').post(verifyOTPWithEmailOrPhone);

// OTP resend
router.route('/resend-otp').post(resendOTPWithEmailOrPhone);

// forgot password
router.route('/forgot-password').post(forgotPasswordWithEmailOrPhone);

// reset password
router.route('/reset-password').post(resetPasswordWithOTP);

// user login
router.route('/login').post(loginWithEmailOrPhone);

// refresh access and refresh token
router.route('/refresh-token').post(refreshAccessAndRefreshToken);

export default router;
