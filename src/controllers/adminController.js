import User from '../models/User.js';
import Service from '../models/Service.js';
import AuditLog from '../models/AuditLog.js';

export const createAttendant = async (req, res) => {
    const { username, email, password } = req.body;
    await User.create({ username, email, password, role: 'attendant', isApproved: true });
    res.json({ success: true, message: "Attendant account created" });
};

export const addService = async (req, res) => {
    const service = await Service.create(req.body);
    res.json({ success: true, data: service });
};

export const getDailyLogs = async (req, res) => {
    try {
        const { date } = req.query; 
        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);

        const logs = await AuditLog.find({
            createdAt: { $gte: start, $lt: end }
        });
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching logs" });
    }
};