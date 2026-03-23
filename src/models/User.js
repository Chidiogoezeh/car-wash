import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'attendant', 'customer'], default: 'customer' },
    isApproved: { type: Boolean, default: true }, // Changed default to true
    deviceId: { type: String, required: true, unique: true }, // New unique field
    lastActive: { type: Date, default: Date.now },
    deletionScheduledDate: { type: Date, default: null }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);