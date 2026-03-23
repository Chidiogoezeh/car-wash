import express from 'express';
import { 
    register, 
    login, 
    logout, 
    getMe, 
    updatePassword 
} from '../controllers/authController.js';
import { scheduleDeletion } from '../controllers/userController.js';
import { protect, authRateLimiter } from '../middleware/auth.js';
import { systemLogger } from '../middleware/logger.js';
import { geoBlock } from '../middleware/geoBlock.js';

const router = express.Router();

// Apply Geo-blocking and Rate Limiting to sensitive public routes
router.post('/register', geoBlock, authRateLimiter, register);
router.post('/login', geoBlock, authRateLimiter, systemLogger, login);

// Protected routes
router.use(protect); 

router.get('/me', getMe);
router.post('/logout', logout);
router.put('/update-password', updatePassword);
router.post('/schedule-deletion', scheduleDeletion); 

export default router;