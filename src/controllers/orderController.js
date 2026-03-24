import Order from '../models/Order.js';

/**
 * @desc    Create a new booking
 * @route   POST /api/orders
 * @access  Private (Customer)
 */
export const createOrder = async (req, res) => {
    try {
        const { service, vehiclePlate, slot } = req.body;

        // Validation to match dashboard.js setupBookingSubmission
        if (!service || !vehiclePlate || !slot) {
            return res.status(400).json({ 
                success: false, 
                message: "Please fill all fields: service, slot, and plate number." 
            });
        }

        const newOrder = await Order.create({
            customer: req.user._id,
            service, 
            vehiclePlate, 
            slot, 
            status: 'pending' // Initial state
        });

        res.status(201).json({ 
            success: true, 
            message: "Booking successful!", 
            data: newOrder 
        });
    } catch (err) {
        console.error("[Create Order Error]:", err.message);
        res.status(400).json({ 
            success: false, 
            message: "Booking failed. Please try again." 
        });
    }
};

/**
 * @desc    Get all orders for the logged-in customer
 * @route   GET /api/orders/my-orders
 * @access  Private (Customer)
 */
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id })
            .populate('service')
            .sort('-createdAt'); // Newest first

        res.json({ 
            success: true, 
            data: orders 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Error fetching your order history." 
        });
    }
};

/**
 * @desc    Customer notifies admin that payment has been made
 * @route   PATCH /api/orders/paid/:id
 * @access  Private (Customer)
 */
export const markAsPaid = async (req, res) => {
    try {
        // Find the order ensuring it belongs to the logged-in customer
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, customer: req.user._id },
            { 
                // We keep paymentConfirmed as false until Admin verifies via Bank Statement
                // But we can update the status so the Admin knows to check it.
                status: 'completed' 
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: "Order not found or unauthorized." 
            });
        }

        res.json({ 
            success: true, 
            message: "Admin notified of payment. Please wait for confirmation." 
        });
    } catch (err) {
        console.error("[Mark As Paid Error]:", err.message);
        res.status(500).json({ 
            success: false, 
            message: "Failed to update payment notification status." 
        });
    }
};