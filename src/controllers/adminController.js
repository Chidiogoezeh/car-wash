import User from '../models/User.js';
import Service from '../models/Service.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';

export const createAttendant = async (req, res) => {
    try {
        const { username, email } = req.body;
        await User.create({ 
            username, email, password: 'ChangeMe123!', 
            role: 'attendant', isApproved: true,
            deviceId: `STAFF_${Date.now()}`
        });
        res.json({ success: true, message: "Attendant account created." });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const getAttendants = async (req, res) => {
    try {
        const staff = await User.find({ role: 'attendant', isApproved: true }).select('username _id');
        res.json({ success: true, attendants: staff });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch attendants" });
    }
};

export const addService = async (req, res) => {
    try {
        const service = await Service.create(req.body);
        res.json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({ success: false, message: "Failed to add service" });
    }
};

export const getServices = async (req, res) => {
    try {
        const services = await Service.find({ isActive: true });
        res.json({ success: true, services });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch services" });
    }
};

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

// NEW: Admin confirms the payment received in the bank
export const confirmPayment = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: 'paid', paymentConfirmed: true },
            { new: true }
        );
        res.json({ success: true, message: "Payment confirmed!", data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: "Confirmation failed" });
    }
};

export const getDailyLogs = async (req, res) => {
    try {
        const { date } = req.query; 
        if (!date) return res.status(400).json({ success: false, message: "Date is required" });
        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);
        const logs = await AuditLog.find({ createdAt: { $gte: start, $lt: end } });
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching logs" });
    }
};