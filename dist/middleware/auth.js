"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
module.exports = (req, res, next) => {
    // get token from header
    const token = req.header("auth-token");
    // check if no token
    if (!token) {
        return res.status(401).json({ msg: "Токен не введен" });
    }
    // verifying token
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.jwtSecret);
        req.body.decoded_user_id = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ msg: "Неверный токен авторизации" });
    }
};
//# sourceMappingURL=auth.js.map