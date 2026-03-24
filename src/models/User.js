import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, 'Please provide a username'],
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, 'Please provide an email'], 
        unique: true, 
        lowercase: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false // Security: Don't return password in queries by default
    },
    role: { 
        type: String, 
        enum: ['admin', 'attendant', 'customer'], 
        default: 'customer' 
    },
    isApproved: { 
        type: Boolean, 
        default: true 
    },
    /** * We removed unique: true and sparse: true here to prevent 
     * E11000 duplicate key errors that were likely blocking your users.
     */
    deviceId: { 
        type: String, 
        default: null 
    },
    lastActive: { 
        type: Date, 
        default: Date.now 
    },
    deletionScheduledDate: { 
        type: Date, 
        default: null 
    }
}, { timestamps: true });

// --- MIDDLEWARE ---

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// --- METHODS ---

/**
 * Match user-entered password to hashed password in database
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
    // Standard bcrypt compare
    return await bcrypt.compare(enteredPassword, this.password);
};

// Prevent model overwrite error during hot reloads
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;