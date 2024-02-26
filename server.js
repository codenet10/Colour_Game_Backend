import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { AdminRoute } from './routes/admin.route.js';
import { UserRoute } from './routes/user.route.js';
import { errorHandler } from './middleware/ErrorHandling.js';
import { dbConnection } from './DB/dbconnection.js';
import { verifyJWT } from './middleware/JWTVerify.js';


import cors from 'cors';

dotenv.config();

const app = express();

app.use(express.json());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = process.env.FRONTEND_URI.split(',');
app.use(cors({ origin: allowedOrigins }));

AdminRoute(app);
UserRoute(app);

app.use(verifyJWT);


app.use(errorHandler);
// app.use(notFound);

(async function dbConnect() {
  try {
    await dbConnection();

    app.listen(process.env.PORT, () => {
      console.log(`App is running on http://localhost:${process.env.PORT || 8080}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
})();
