import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { updateTaskStatus, assignAttendant, getMyTasks } from '../controllers/taskController.js';

const router = express.Router();

// Attendants see their own tasks
router.get('/my-tasks', protect, authorize('attendant'), getMyTasks);

// Admin assigns tasks
router.patch('/assign', protect, authorize('admin'), assignAttendant);

// Attendants update status
router.patch('/status/:id', protect, authorize('attendant'), updateTaskStatus);

export default router;