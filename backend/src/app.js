import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { CustomError } from './utils/CustomError.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.middleware.js';

const app = express();

// configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// import routes
import userRouter from './routes/user.route.js';

// route declaration
app.use('/api/v1/user', userRouter);

// run when can't find path
app.all('*', (req, res, next) => {
  const err = new CustomError(404, `Can't find ${req.originalUrl} on the server!`);
  next(err);
});

app.use(globalErrorHandler);

export { app };
