import User from '../models/User.js';
import Service from '../models/Service.js';
import AuditLog from '../models/AuditLog.js';

export const createAttendant = async (req, res) => {
    try {
        const { username, email } = req.body;
        
        // Admin creates attendant
        // We set a default password that they can change later
        await User.create({ 
            username, 
            email, 
            password: 'ChangeMe123!', 
            role: 'attendant', 
            isApproved: true,
            deviceId: `STAFF_${Date.now()}` // Unique system ID for staff
        });

        res.json({ success: true, message: "Attendant account created with default password: ChangeMe123!" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
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

/** * Added this to satisfy the frontend renderServices() call
 */
export const getServices = async (req, res) => {
    try {
        const services = await Service.find({ isActive: true });
        res.json({ success: true, services });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch services" });
    }
};

export const getDailyLogs = async (req, res) => {
    try {
        const { date } = req.query; 
        if (!date) return res.status(400).json({ success: false, message: "Date is required" });

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