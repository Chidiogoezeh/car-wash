import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendStatusEmail } from '../utils/mailer.js';

/**
 * @desc    Get tasks assigned specifically to the logged-in attendant
 */
export const getMyTasks = async (req, res) => {
    try {
        // Find orders where 'attendant' field matches the logged-in user's ID
        const tasks = await Order.find({ attendant: req.user._id })
            .populate('service')
            .sort('-createdAt');

        res.json({ success: true, data: tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching your tasks" });
    }
};

/**
 * @desc    Admin assigns an attendant to an order
 */
export const assignAttendant = async (req, res) => {
    try {
        const { orderId, attendantId } = req.body;
        
        const attendant = await User.findById(attendantId);
        if (!attendant || attendant.role !== 'attendant') {
            return res.status(400).json({ success: false, message: "Invalid attendant selection" });
        }

        const order = await Order.findByIdAndUpdate(
            orderId, 
            { attendant: attendantId, status: 'assigned' }, 
            { new: true }
        ).populate('customer attendant');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.json({ success: true, message: "Task assigned successfully", data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Update progress and notify customer on completion
 */
export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        // Find the order first to ensure it exists
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        ).populate('customer');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Only trigger email if status changed to 'completed'
        if (status === 'completed' && order.customer && order.customer.email) {
            // We don't 'await' this so the response stays fast for the attendant
            sendStatusEmail(order.customer.email, order.vehiclePlate, 'completed');
        }
        
        res.json({ success: true, message: `Status updated to ${status}`, data: order });
    } catch (err) {
        console.error("[Status Update Error]:", err);
        res.status(500).json({ success: false, message: "Failed to update task status" });
    }
};