import sqlPool from "../DataBase/DB.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
  try {
    const { email, password, full_name, user_type } = req.body;

    // Validate required fields
    if (!email || !password || !full_name || !user_type) {
      return res.status(400).json({
        success: false,
        message: "Email, password, full name, and user type are required",
      });
    }

    // Validate user_type
    if (!["FREELANCER", "CLIENT", "ADMIN"].includes(user_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type. Must be Freelancer, Client or Admin",
      });
    }
    //Check existing user
    const [existingUser] = await sqlPool.execute(
      "SELECT id from users WHERE email = ?",
      [email],
    );
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hashing of the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await sqlPool.execute(
      `INSERT INTO users (email, password,full_name,user_type) VALUES (?,?,?,?)`,
      [email, hashedPassword, full_name, user_type],
    );

    // // Generate JWT token
    // const token = jwt.sign(
    //   { userId: result.insertId, email, user_type },
    //   JWT_SECRET,
    //   { expiresIn: "7d" },
    // );

    //Response
    res.status(201).json({
      success: true,
      message: "Registration successful. Please login to proceed.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    //Check if user exists
    const [rows] = await sqlPool.execute(
      "SELECT id,email, password,full_name, user_type FROM users WHERE email = ?",
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Matching the email
    const isMatch = await bcrypt.compare(password, rows[0].password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }
    const token = jwt.sign(
      {
        userId: rows[0].id,
        email,
        user_type: rows[0].user_type,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    //Send success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: rows[0].id,
        email: rows[0].email,
        user_type: rows[0].user_type,
        full_name: rows[0].full_name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT * FROM users WHERE id = ?
    `;

    const [rows] = await sqlPool.execute(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
