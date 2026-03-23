import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendStatusEmail } from '../utils/mailer.js';

/**
 * @desc    Admin assigns an attendant to a pending order
 * @route   PATCH /api/tasks/assign
 */
export const assignAttendant = async (req, res) => {
    try {
        const { orderId, attendantId } = req.body;

        // 1. Verify the attendant exists and is actually an attendant
        const attendant = await User.findById(attendantId);
        if (!attendant || attendant.role !== 'attendant') {
            return res.status(400).json({ success: false, message: "Invalid attendant selected" });
        }

        // 2. Update the order
        const order = await Order.findByIdAndUpdate(
            orderId, 
            { 
                attendant: attendantId, 
                status: 'assigned' 
            }, 
            { new: true }
        ).populate('customer attendant');

        res.json({ success: true, message: "Attendant assigned successfully", data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Attendants update the progress of a wash
 * @route   PATCH /api/tasks/status/:id
 */
export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        // Find order and populate customer to get their email
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        ).populate('customer');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Notify user when wash is completed
        if (status === 'completed' && order.customer && order.customer.email) {
            await sendStatusEmail(order.customer.email, order.vehiclePlate, 'completed');
        }
        
        res.json({ success: true, data: order });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ success: false, message: "Update failed" });
    }
};