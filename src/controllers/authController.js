import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    try {
        let { username, email, password, deviceId } = req.body;

        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: "Invalid input format" });
        }

        // Normalize email
        email = email.trim().toLowerCase();

        const existingDevice = await User.findOne({ deviceId: String(deviceId) });
        if (existingDevice) {
            return res.status(403).json({ 
                success: false, 
                message: "This device is already linked to an account." 
            });
        }

        await User.create({ username, email, password, deviceId, isApproved: true });
        res.status(201).json({ success: true, message: "Registration successful!" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please provide email and password" });
        }

        // Normalize email to match seeded data
        email = String(email).trim().toLowerCase();
        password = String(password);

        // We MUST select('+password') because it is hidden in the model
        const user = await User.findOne({ email }).select('+password'); 

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Use the model method to compare
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.cookie('token', token, { 
            httpOnly: true, 
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });
        
        res.json({ 
            success: true, 
            user: { username: user.username, role: user.role } 
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Server error during login" });
    }
};

export const getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};

export const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out' });
};

export const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.password = req.body.password;
        await user.save();
        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
};