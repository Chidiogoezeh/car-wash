import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createAttendant, addService, getDailyLogs } from '../controllers/adminController.js';

const router = express.Router();
router.use(protect, authorize('admin'));

router.post('/attendant', createAttendant);
router.post('/services', addService);
router.get('/logs', getDailyLogs);

export default router;