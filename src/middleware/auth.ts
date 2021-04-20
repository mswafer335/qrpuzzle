import jwt from "jsonwebtoken"
import { Response, Request, NextFunction } from "express";

export = (req:Request, res:Response, next:NextFunction)=> {
  // get token from header
  const token = req.header("auth-token");

  // check if no token
  if (!token) {
    return res.status(401).json({ msg: "Токен не введен" });
  }

  // verifying token
  try {
    const decoded:any = jwt.verify(token, process.env.jwtSecret);
    req.user = decoded.admin.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Неверный токен авторизации" });
  }
};
