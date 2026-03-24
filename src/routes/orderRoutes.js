import express from 'express';
import { createOrder, getMyOrders, markAsPaid } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All order routes require the user to be logged in
router.use(protect);

/**
 * @route   POST /api/orders
 * @desc    Create a new booking (Matches dashboard.js: setupBookingSubmission)
 */
router.post('/', createOrder);

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get logged-in user's orders (Matches dashboard.js: renderMyOrders)
 */
router.get('/my-orders', getMyOrders);

/**
 * @route   PATCH /api/orders/paid/:id
 * @desc    Customer notifies admin of payment (Matches dashboard.js: updateStatus logic)
 */
router.patch('/paid/:id', markAsPaid);

export default router;