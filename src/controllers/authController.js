import User from '../models/User.js';
import jwt from 'jsonwebtoken';

/**
 * @desc    Register a new user (Customer)
 * @route   POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        let { username, email, password } = req.body;

        // 1. Basic Validation
        if (!email || !password || !username) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        // 2. Normalize Data
        email = email.trim().toLowerCase();

        // 3. Create User 
        // We rely on the 'sparse' index in the Model to handle optional deviceId
        const user = await User.create({ 
            username, 
            email, 
            password, 
            isApproved: true 
        });

        console.log(`[Auth]: New user registered: ${user.email}`);

        res.status(201).json({ 
            success: true, 
            message: "Registration successful! You can now log in." 
        });

    } catch (err) {
        console.error("Registration Error:", err.message);
        
        // Handle MongoDB unique constraint error (11000) for email
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "This email or device is already registered." 
            });
        }
        
        res.status(400).json({ 
            success: false, 
            message: "Invalid registration data. Please try again." 
        });
    }
};

/**
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide email and password" 
            });
        }

        email = String(email).trim().toLowerCase();

        // Must select('+password') because it's hidden in the Schema
        const user = await User.findOne({ email }).select('+password'); 

        if (!user || !(await user.comparePassword(String(password)))) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // 4. Generate JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
            expiresIn: '1d' 
        });
        
        // 5. Set Cookie 
        // secure: false for localhost, lax for cross-origin navigation
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax', 
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        
        console.log(`[Auth]: ${user.username} (${user.role}) logged in.`);

        res.json({ 
            success: true, 
            user: { 
                username: user.username, 
                role: user.role 
            } 
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Server error during login" 
        });
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 */
export const getMe = async (req, res) => {
    // req.user is populated by the 'protect' middleware
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: "Not authenticated" 
        });
    }
    res.json({ success: true, user: req.user });
};

/**
 * @desc    Logout user / Clear cookie
 * @route   POST /api/auth/logout
 */
export const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });
    res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/update-password
 */
export const updatePassword = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ 
                success: false, 
                message: "New password is required" 
            });
        }

        // We find by ID and explicitly update password field
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // This triggers the .pre('save') hashing hook in your User model
        user.password = password;
        await user.save();
        
        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        console.error("Update Password Error:", err.message);
        res.status(500).json({ success: false, message: "Update failed" });
    }
};