import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendStatusEmail } from '../utils/mailer.js';

/**
 * @desc    Get tasks assigned specifically to the logged-in attendant
 */
export const getMyTasks = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Find orders assigned to this attendant
        // We populate 'service' so 'Wash Type' shows the name, not just an ID
        const tasks = await Order.find({ attendant: req.user._id })
            .populate('service', 'name price')
            .sort('-createdAt');

        res.json({ success: true, data: tasks });
    } catch (err) {
        console.error(`[Fetch Tasks Error]: ${err.message}`);
        res.status(500).json({ success: false, message: "Error fetching your tasks" });
    }
};

/**
 * @desc    Admin assigns an attendant to an order
 * @route   PATCH /api/tasks/assign/:id
 */
export const assignAttendant = async (req, res) => {
    try {
        const { attendantId } = req.body;
        const orderId = req.params.id; 
        
        if (!attendantId) {
            return res.status(400).json({ success: false, message: "Please select an attendant" });
        }

        // 1. Verify attendant exists and is actually an attendant
        const attendant = await User.findById(attendantId);
        if (!attendant || attendant.role !== 'attendant') {
            return res.status(400).json({ success: false, message: "Invalid attendant selection" });
        }

        // 2. Update order and move status to 'assigned'
        const order = await Order.findByIdAndUpdate(
            orderId, 
            { 
                attendant: attendantId, 
                status: 'assigned' 
            }, 
            { new: true, runValidators: true }
        ).populate('customer attendant service');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.json({ 
            success: true, 
            message: `Order assigned to ${attendant.username}`, 
            data: order 
        });
    } catch (err) {
        console.error(`[Assign Task Error]: ${err.message}`);
        res.status(500).json({ success: false, message: "Failed to assign task" });
    }
};

/**
 * @desc    Update progress and notify customer on completion
 * @route   PATCH /api/tasks/complete/:id
 */
export const updateTaskStatus = async (req, res) => {
    try {
        // If the 'Mark Done' button is clicked, body.status might be empty, so we default to 'completed'
        const newStatus = req.body.status || 'completed';
        
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: newStatus }, 
            { new: true }
        ).populate('customer service');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // 3. Email Notification Logic
        // We only send an email if the status is moving to 'completed'
        if (newStatus === 'completed' && order.customer && order.customer.email) {
            sendStatusEmail(
                order.customer.email, 
                order.vehiclePlate, 
                'completed'
            ).catch(e => console.error('[Mailer Error]:', e.message));
        }
        
        res.json({ 
            success: true, 
            message: `Status updated to ${newStatus.toUpperCase()}`, 
            data: order 
        });
    } catch (err) {
        console.error(`[Status Update Error]: ${err.message}`);
        res.status(500).json({ success: false, message: "Failed to update task status" });
    }
};