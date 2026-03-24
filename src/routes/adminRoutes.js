import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { 
    createAttendant, 
    getAttendants,
    addService, 
    getServices, 
    getAllOrders, // New
    getDailyLogs 
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.post('/attendant', createAttendant);
router.get('/attendants', getAttendants);

router.post('/services', addService);
router.get('/services', getServices);

router.get('/orders', getAllOrders);
router.get('/logs', getDailyLogs);

export default router;