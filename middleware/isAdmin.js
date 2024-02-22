import { Admin } from "../models/admin.model.js";
import { User } from "../models/user.model.js";



export const isAdmin = async (req, res, next) => {
    const { userName } = req.user;
    console.log(userName, "userssssss");
    try {
        const findAdmin = await Admin.findOne({ userName });
        console.log("findddd", findAdmin)
        if (!findAdmin || findAdmin.roles.indexOf("Admin") === -1) {
            throw new Error("Admin Not Found");
        } else {
            next();
        }
    } catch (error) {
        res.status(401).send({ error: "Unauthorized", message: error.message });
    }
}
export const isUser = async (req, res, next) => {
    const { userName } = req.user;
    console.log(userName, "userssssss");
    try {
        const findUser = await User.findOne({ userName });
        console.log("findUserrrrr", findUser)
        if (!findUser || findUser.roles.indexOf("User") === -1) {
            throw new Error("User Not Found");
        } else {
            next();
        }
    } catch (error) {
        res.status(401).send({ error: "Unauthorized", message: error.message });
    }
}