import { User } from "../models/user.model.js";

export const UserController = {

    eligibilityCheck: async (userId, eligibilityCheck) => {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw {code: 404,message: "User not found" };
            }
            if (eligibilityCheck) {
                user.eligibilityCheck = true;
                await user.save();
                return {message: "User Eligible" };
            } else {
                user.eligibilityCheck = false;
                await user.save();
                return {message: "User Not Eligible" };
            }
        } catch (err) {
            throw { code: err.code, message: err.message };
        }
    }
    
}




