import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';

/**
 * Prevents Brute Force attacks on Login/Register
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, 
    message: { success: false, message: "Too many attempts, please try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Protects routes by verifying the JWT in cookies
 */
export const protect = async (req, res, next) => {
    // Check if cookie exists
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized: No token found' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user but exclude password for security
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        /**
         * Update lastActive WITHOUT triggering .save() hooks.
         * This prevents the 'pre-save' hook from trying to re-hash 
         * an undefined password.
         */
        await User.updateOne(
            { _id: user._id }, 
            { $set: { lastActive: Date.now() } }
        );
        
        req.user = user;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ success: false, message: 'Token invalid or expired' });
    }
};

/**
 * Authorizes specific roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Forbidden: ${req.user ? req.user.role : 'Unknown'} role access denied` 
            });
        }
        next();
    };
};