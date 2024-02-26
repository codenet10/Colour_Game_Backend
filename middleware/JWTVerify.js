import jwt from 'jsonwebtoken';
import { Admin } from '../models/admin.model.js';

export const verifyJWT = async (req, res, next) => {
  // let token;
  const authToken = req.headers.authorization;
  if (!authToken) {
    return res.status(401).send({ code: 401, message: 'Token Not Found' });
  }
  const tokenParts = authToken.split(' ');
  if (tokenParts.length !== 2 || !(tokenParts[0] === 'Bearer' && tokenParts[1])) {
    return res.status(401).send({ code: 401, message: 'Invalid Login Attempt' });
  }
  try {
    if (tokenParts) {
      const decodedToken = jwt.verify(tokenParts[1], process.env.JWT_SECRET_KEY);
      const user = await Admin.findById(decodedToken?.id).select('-password');
      if (!user) {
        throw new Error('Admin not found');
      }
      req.user = user;
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(401).send({ error: 'Please Login again', message: error.message });
  }
};
