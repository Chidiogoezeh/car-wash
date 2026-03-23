import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // e.g., "10:00 AM"
    isBooked: { type: Boolean, default: false },
    maxCars: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.model('Schedule', scheduleSchema);