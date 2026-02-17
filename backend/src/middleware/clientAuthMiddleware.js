import jwt, { decode } from "jsonwebtoken";
import sqlPool from "../DataBase/DB.js";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const clientAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from DB
    const [rows] = await sqlPool.execute(
      "SELECT id, email, user_type, is_verified FROM users WHERE id = ?",
      [decoded.userId],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach the user to request
    req.user = rows[0];
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const clientOnly = (req, res, next) => {
  if (req.user.user_type !== "CLIENT") {
    return res.status(403).json({
      success: false,
      message: "Only clients are allowed to perform this action",
    });
  }
  next();
};

export const verifiedOnly = async (req, res, next) => {
  if (req.user.is_verified === 0) {
    return res.status(403).json({
      success: false,
      message: "Please verify your account before continuing",
    });
  }

  next();
};
