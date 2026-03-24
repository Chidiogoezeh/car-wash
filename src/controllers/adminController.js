import User from '../models/User.js';
import Service from '../models/Service.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';

/**
 * @desc    Create a new staff/attendant account
 */
export const createAttendant = async (req, res) => {
    try {
        const { username, email } = req.body;
        // Password defaults to a temporary string for staff to change later
        await User.create({ 
            username, 
            email, 
            password: 'ChangeMe123!', 
            role: 'attendant', 
            isApproved: true,
            deviceId: `STAFF_${Date.now()}` // Bypass unique deviceId constraint for staff
        });
        res.json({ success: true, message: "Attendant account created." });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Get list of all approved attendants (for assignment dropdowns)
 */
export const getAttendants = async (req, res) => {
    try {
        const staff = await User.find({ role: 'attendant', isApproved: true }).select('username _id');
        res.json({ success: true, attendants: staff });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch attendants" });
    }
};

/**
 * @desc    Add a new car wash service type
 */
export const addService = async (req, res) => {
    try {
        const service = await Service.create(req.body);
        res.json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({ success: false, message: "Failed to add service" });
    }
};

/**
 * @desc    Get all active services (Used by both Admin and Customer dropdowns)
 */
export const getServices = async (req, res) => {
    try {
        const services = await Service.find({ isActive: true });
        // Key 'services' matches populateBookingDropdown in dashboard.js
        res.json({ success: true, services });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch services" });
    }
};

/**
 * @desc    Get every order in the system (Admin Overview)
 */
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('service customer attendant')
            .sort('-createdAt');
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

/**
 * @desc    Confirm payment has been received (Admin manual action)
 */
export const confirmPayment = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: 'paid', paymentConfirmed: true },
            { new: true }
        );
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        
        res.json({ success: true, message: "Payment confirmed!", data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: "Confirmation failed" });
    }
};

/**
 * @desc    Fetch audit logs for a specific day
 */
export const getDailyLogs = async (req, res) => {
    try {
        const { date } = req.query; 
        if (!date) return res.status(400).json({ success: false, message: "Date is required" });
        
        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);

        const logs = await AuditLog.find({ 
            createdAt: { $gte: start, $lt: end } 
        }).sort('-createdAt');

        // Key 'logs' matches renderDailyActivity in dashboard.js
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching logs" });
    }
};