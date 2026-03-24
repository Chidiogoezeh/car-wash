import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendStatusEmail } from '../utils/mailer.js';

/**
 * @desc    Get tasks assigned specifically to the logged-in attendant
 */
export const getMyTasks = async (req, res) => {
    try {
        const tasks = await Order.find({ attendant: req.user._id })
            .populate('service')
            .sort('-createdAt');
        res.json({ success: true, data: tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching tasks" });
    }
};

export const assignAttendant = async (req, res) => {
    try {
        const { orderId, attendantId } = req.body;
        const attendant = await User.findById(attendantId);
        
        if (!attendant || attendant.role !== 'attendant') {
            return res.status(400).json({ success: false, message: "Invalid attendant" });
        }

        const order = await Order.findByIdAndUpdate(
            orderId, 
            { attendant: attendantId, status: 'assigned' }, 
            { new: true }
        ).populate('customer attendant');

        res.json({ success: true, message: "Task assigned!", data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        ).populate('customer');

        if (status === 'completed' && order.customer?.email) {
            await sendStatusEmail(order.customer.email, order.vehiclePlate, 'completed');
        }
        
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
};