import jwt from "jsonwebtoken";
import sqlPool from "../DataBase/DB.js";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = async (req, res, next) => {
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
      "SELECT id, email, full_name, user_type, is_verified FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request (includes user_type)
    req.user = {
      id: rows[0].id,
      email: rows[0].email,
      name: rows[0].name,
      user_type: rows[0].user_type,
      is_verified: rows[0].is_verified
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Middleware to check if user is a freelancer
export const requireFreelancer = (req, res, next) => {
  if (req.user.user_type !== "FREELANCER") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Freelancers only.",
    });
  }
  next();
};

// Middleware to check if user is a client
export const requireClient = (req, res, next) => {
  if (req.user.user_type !== "CLIENT") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Clients only.",
    });
  }
  next();
};

// Verified users only
export const verifiedOnly = (req, res, next) => {
  if (req.user.is_verified === 0) {
    return res.status(403).json({
      success: false,
      message: "Please verify your account before continuing",
    });
  }
  next();
};
