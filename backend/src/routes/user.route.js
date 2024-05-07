import { Router } from 'express';
import {
  addOrUpdateUserAddress,
  addOrUpdateUserAvatar,
  getUserProfile,
  updateUserProfile,
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// // add user address
router.route('/add-address').post(verifyJWT, addOrUpdateUserAddress);

// // update user address
router.route('/update-address').post(verifyJWT, addOrUpdateUserAddress);

// // edit user profile (displaName or address)
router.route('/update-profile').post(verifyJWT, updateUserProfile);

// add or update user avatar
router.route('/avatar').patch(verifyJWT, upload.single('avatar'), addOrUpdateUserAvatar);

// get user profile
router.route('/profile').get(verifyJWT, getUserProfile);

export default router;
