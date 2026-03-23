import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { 
        type: String, 
        required: true,
        select: false // Security: Don't return password in queries by default
    },
    role: { 
        type: String, 
        enum: ['admin', 'attendant', 'customer'], 
        default: 'customer' 
    },
    isApproved: { type: Boolean, default: true },
    /** 
     * Required only for customers to enforce one-account-per-device.
     * Sparse allows multiple 'null' values for Admin/Attendants without unique conflicts.
     */
    deviceId: { 
        type: String, 
        unique: true,
        sparse: true, 
        required: function() {
            return this.role === 'customer';
        }
    },
    lastActive: { type: Date, default: Date.now },
    deletionScheduledDate: { type: Date, default: null }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match user-entered password to hashed password in database
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;