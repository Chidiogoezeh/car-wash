import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { 
    createAttendant, 
    getAttendants,
    addService, 
    getServices, 
    getAllOrders, 
    getDailyLogs,
    confirmPayment 
} from '../controllers/adminController.js';

const router = express.Router();

// Publicly available to all logged-in users for the booking dropdown
router.get('/services', protect, getServices);

// Admin-only routes
router.use(protect, authorize('admin'));

router.post('/attendant', createAttendant);
router.get('/attendants', getAttendants);

router.post('/services', addService);
router.get('/orders', getAllOrders);
router.get('/logs', getDailyLogs);

// Syncing with adminConfirmPayment(orderId) in dashboard.js
router.patch('/confirm-payment/:id', confirmPayment);

export default router;