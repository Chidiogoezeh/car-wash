import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    }, // e.g., "Express Wash"
    price: { 
        type: Number, 
        required: true,
        min: 0 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);