import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Express Wash"
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);