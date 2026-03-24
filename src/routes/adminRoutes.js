import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { 
    createAttendant, 
    getAttendants,
    addService, 
    getServices, 
    getAllOrders, 
    getDailyLogs 
} from '../controllers/adminController.js';

const router = express.Router();

// Allow any logged-in user (Customer/Attendant/Admin) to see available services
router.get('/services', protect, getServices);

// Everything below this line requires ADMIN role
router.use(protect, authorize('admin'));

router.post('/attendant', createAttendant);
router.get('/attendants', getAttendants);

router.post('/services', addService);
router.get('/orders', getAllOrders);
router.get('/logs', getDailyLogs);

export default router;