import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { fileURLToPath } from 'url';

// Config & Utils
import connectDB from './src/config/database.js';
import { startCronJobs } from './src/utils/cronJobs.js';

// Route Imports
import authRoutes from './src/routes/authRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';

// Middleware
import { geoBlock } from './src/middleware/geoBlock.js';
import { systemLogger } from './src/middleware/logger.js';

// 1. INITIALIZE APPS & ENV
dotenv.config();
connectDB();
startCronJobs();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. SECURITY & LOGGING (Must be first)
app.use(helmet({
    contentSecurityPolicy: false, // Allows loading your own scripts/styles easily in dev
})); 
app.use(mongoSanitize());

// 3. CORS & PARSERS (Must be before routes for Login/Cookies to work)
app.use(cors({ 
    // If in production, use the CLIENT_URL; otherwise allow the local dev origin
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true, 
    credentials: true 
}));

app.use(express.json({ limit: '10kb' })); 
app.use(cookieParser());

// 4. GLOBAL CUSTOM MIDDLEWARE
app.use(geoBlock); 
app.use(systemLogger); 

// 5. STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// 6. API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/orders', orderRoutes);

// 7. FRONTEND ROUTING (SPA SUPPORT)
app.get('*', (req, res, next) => {
    // Avoid sending HTML for failed API calls
    if (req.url.startsWith('/api')) return next();
    
    // Fallback to index.html for all other routes
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 8. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    console.error(`[Server Error]: ${err.stack}`);
    
    res.status(statusCode).json({ 
        success: false, 
        message: process.env.NODE_ENV === 'production' 
            ? 'An internal error occurred' 
            : err.message 
    });
});

// 9. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(` Sparkle Car Wash Server is LIVE`);
    console.log(` Port: ${PORT}`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`-------------------------------------------`);
});