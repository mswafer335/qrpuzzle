import jwt from "jsonwebtoken"
import { Response, Request, NextFunction } from "express";

module.exports = (req:Request, res:Response, next:NextFunction)=> {
  // get token from header
  const token = req.header("auth-token");

  // check if no token
  if (!token) {
    return res.status(401).json({ msg: "Токен не введен" });
  }

  // verifying token
  try {
    const decoded = jwt.verify(token, process.env.jwtSecret);

    req.body.decoded_user_id = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Неверный токен авторизации" });
  }
};
