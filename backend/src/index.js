import dotenv from 'dotenv';
import connectDB from './db/db.js';
import { app } from './app.js';

dotenv.config({ path: './.env' });

connectDB()
  .then((res) => {
    app.on('Error', (error) => {
      console.log('ERRR: ', error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log('MONGODB connection FAILED: ', error);
  });
