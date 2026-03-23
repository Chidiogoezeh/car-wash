import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { updateTaskStatus, assignAttendant } from '../controllers/taskController.js';

const router = express.Router();

// Admin assigns
router.patch('/assign', protect, authorize('admin'), assignAttendant);

// Attendants update status
router.patch('/status/:id', protect, authorize('attendant'), updateTaskStatus);

export default router;