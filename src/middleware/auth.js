import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';

// Prevents Brute Force attacks on Login/Register
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    message: { success: false, message: "Too many attempts, please try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const protect = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });

        // Update lastActive for the 90-day auto-delete rule
        user.lastActive = Date.now();
        await user.save();
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token invalid or expired' });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: Access Denied' });
        }
        next();
    }
};