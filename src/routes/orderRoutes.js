import express from 'express';
import { createOrder, getMyOrders, markAsPaid } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);

// Syncing with notifyPayment(orderId) in dashboard.js
router.patch('/paid/:id', markAsPaid);

export default router;