import Order from '../models/Order.js';

export const createOrder = async (req, res) => {
    try {
        const { service, vehiclePlate, slot } = req.body;
        
        if (!service || !vehiclePlate || !slot) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide service, vehicle plate, and time slot." 
            });
        }

        const newOrder = await Order.create({
            customer: req.user._id,
            service, 
            vehiclePlate,
            slot,
            status: 'pending'
        });

        res.status(201).json({ 
            success: true, 
            message: "Booking successful!", 
            data: newOrder 
        });
    } catch (err) {
        console.error("Booking Error:", err);
        res.status(400).json({ success: false, message: "Booking failed. Ensure all fields are valid." });
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