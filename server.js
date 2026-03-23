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

// Middleware
import { geoBlock } from './src/middleware/geoBlock.js';
import { systemLogger } from './src/middleware/logger.js';

// Route Imports
import authRoutes from './src/routes/authRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';

dotenv.config();

// Initialize Database Connection
connectDB();

// Initialize Cron Jobs (Requirement #7 & #8: 30/90 day deletions)
startCronJobs();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. SECURITY HEADERS & SANITIZATION
// Helmet sets secure headers (XSS protection, Clickjacking, etc.)
app.use(helmet()); 

// Prevents NoSQL query injection by stripping out '$' and '.' from req.body/params/query
app.use(mongoSanitize());

// 2. PARSERS
app.use(express.json({ limit: '10kb' })); // Security: Limit body size to prevent DoS
app.use(cookieParser());
app.use(cors({ 
    origin: process.env.CLIENT_URL || true, 
    credentials: true 
}));

// 3. GLOBAL LOGGING & RESTRICTIONS
app.use(geoBlock); 
app.use(systemLogger); 

// 4. STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// 5. API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);

/** Maps /api/user calls to authRoutes so account deletion works 
 * without needing a separate userRoutes.js file.
 */
app.use('/api/user', authRoutes); 

// 6. FRONTEND ROUTING
// Ensures that if a user refreshes the page, they don't get a "Cannot GET /dashboard" error
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 7. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    // Log the error for internal use
    console.error(`[Server Error]: ${err.stack}`);
    
    // Maintain a format for errors
    res.status(err.status || 500).json({ 
        success: false, 
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Car Wash Server running on port ${PORT}`);
});