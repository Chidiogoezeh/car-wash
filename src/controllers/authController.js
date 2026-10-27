import User from "../models/User.js";
import jwt from "jsonwebtoken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

const errorResponse = (res, status, message) =>
  res.status(status).json({ success: false, message });

/**
 * @route POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return errorResponse(res, 400, "All fields are required");
    }

    email = email.trim().toLowerCase();

    const user = await User.create({
      username,
      email,
      password,
      isApproved: true,
    });

    console.log(`[Auth]: New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: "Registration successful! You can now log in.",
    });
  } catch (err) {
    console.error("Registration Error:", err);

    if (err.code === 11000) {
      return errorResponse(
        res,
        400,
        "This email or device is already registered.",
      );
    }

    errorResponse(res, 400, "Invalid registration data. Please try again.");
  }
};

/**
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, "Please provide email and password");
    }

    email = String(email).trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(String(password)))) {
      return errorResponse(res, 401, "Invalid email or password");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log(`[Auth]: ${user.username} (${user.role}) logged in.`);

    res.json({
      success: true,
      user: { username: user.username, role: user.role },
    });
  } catch (err) {
    console.error("Login Error:", err);
    errorResponse(res, 500, "Server error during login");
  }
};

/**
 * @route GET /api/auth/me
 */
export const getMe = (req, res) => {
  if (!req.user) {
    return errorResponse(res, 401, "Not authenticated");
  }

  res.json({ success: true, user: req.user });
};

/**
 * @route POST /api/auth/logout
 */
export const logout = (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ success: true, message: "Logged out successfully" });
};

/**
 * @route PUT /api/auth/update-password
 */
export const updatePassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return errorResponse(res, 400, "New password is required");
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    user.password = password;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Update Password Error:", err);
    errorResponse(res, 500, "Update failed");
  }
};
