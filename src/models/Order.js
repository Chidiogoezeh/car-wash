import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attendant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
    vehiclePlate: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'assigned', 'started', 'completed', 'paid'], 
        default: 'pending' 
    },
    paymentConfirmed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);