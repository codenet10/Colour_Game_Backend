import { User } from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const UserController = {
  eligibilityCheck: async (userId, eligibilityCheck) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw { code: 404, message: 'User not found' };
      }
      if (eligibilityCheck) {
        user.eligibilityCheck = true;
        await user.save();
        return { message: 'User Eligible' };
      } else {
        user.eligibilityCheck = false;
        await user.save();
        return { message: 'User Not Eligible' };
      }
    } catch (err) {
      throw { code: err.code, message: err.message };
    }
  },

  loginUser: async (userName, password) => {
    try {
      if (!userName) {
        throw { code: 401, message: 'Invalid userName' };
      }
      if (!password) {
        throw { code: 401, message: 'Invalid password' };
      }
      const existingUser = await User.findOne({ userName: userName });
      if (!existingUser) {
        throw { code: 401, message: 'Invalid userName or Password' };
      }
      const isPasswordValid = await bcrypt.compare(password, existingUser.password);
      if (!isPasswordValid) {
        throw { code: 401, message: 'Invalid userName or Password' };
      }
      const accessTokenResponse = {
        id: existingUser._id,
        userName: existingUser.userName,
        isEighteen: existingUser.eligibilityCheck,
      };
      const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
        expiresIn: '1d',
      });
      return {
        userName: existingUser.userName,
        accessToken: accessToken,
        isEighteen: existingUser.eligibilityCheck,
      };
    } catch (err) {
      console.error(err);
      throw err; 
    }
  },
  

};
