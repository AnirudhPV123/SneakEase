import { User } from '../models/user.model.js';
import { asyncErrorHandler } from '../utils/asyncErrorHandler.js';
import { CustomError } from '../utils/CustomError.js';
import { CustomResponse } from '../utils/CustomResponse.js';

const registerUser = asyncErrorHandler(async (req, res, next) => {
    const result = await User.create(req.body)
    // res.send(result)
});

export { registerUser };
