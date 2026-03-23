import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { 
    createAttendant, 
    addService, 
    getServices, // Added missing import
    getDailyLogs 
} from '../controllers/adminController.js';

const router = express.Router();

// Requirement: Only Admins can access these management routes
router.use(protect, authorize('admin'));

/**
 * ATTENDANT MANAGEMENT
 */
router.post('/attendant', createAttendant);

/**
 * SERVICE MANAGEMENT
 */
// POST: Create a new wash type
router.post('/services', addService);

// GET: Fetch all active services for the dashboard list
router.get('/services', getServices);

// AUDIT & LOGS
router.get('/logs', getDailyLogs);

export default router;