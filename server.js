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
import orderRoutes from './src/routes/orderRoutes.js'; // Added this

// Middleware
import { geoBlock } from './src/middleware/geoBlock.js';
import { systemLogger } from './src/middleware/logger.js';

dotenv.config();

connectDB();
startCronJobs();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. SECURITY
app.use(helmet()); 
app.use(mongoSanitize());

// 2. PARSERS
app.use(express.json({ limit: '10kb' })); 
app.use(cookieParser());
app.use(cors({ 
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true, 
    credentials: true 
}));

// 3. GLOBAL MIDDLEWARE
app.use(geoBlock); 
app.use(systemLogger); 

// 4. STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// 5. API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/orders', orderRoutes); // Registered the Order routes
app.use('/api/user', authRoutes); 

// 6. FRONTEND ROUTING
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 7. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(`[Server Error]: ${err.stack}`);
    res.status(err.status || 500).json({ 
        success: false, 
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Car Wash Server running on port ${PORT}`);
});