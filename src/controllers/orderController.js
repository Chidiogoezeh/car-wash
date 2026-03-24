import Order from '../models/Order.js';

export const createOrder = async (req, res) => {
    try {
        const { service, vehiclePlate, slot } = req.body;
        if (!service || !vehiclePlate || !slot) {
            return res.status(400).json({ success: false, message: "Missing fields." });
        }
        const newOrder = await Order.create({
            customer: req.user._id,
            service, vehiclePlate, slot, status: 'pending'
        });
        res.status(201).json({ success: true, message: "Booking successful!", data: newOrder });
    } catch (err) {
        res.status(400).json({ success: false, message: "Booking failed." });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id })
            .populate('service')
            .sort('-createdAt');
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching orders" });
    }
};

// NEW: Customer clicks "I have paid"
export const markAsPaid = async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, customer: req.user._id },
            { status: 'completed' }, // Keeping status as completed but ready for admin verification
            { new: true }
        );
        res.json({ success: true, message: "Admin notified of payment." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to update payment status." });
    }
};