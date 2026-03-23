import express from 'express';
import { createOrder, getMyOrders } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All order routes require login
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);

export default router;