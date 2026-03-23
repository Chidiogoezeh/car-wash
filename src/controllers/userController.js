import User from '../models/User.js';

/**
 * @desc    Schedule account for permanent deletion (Req #8)
 * @route   POST /api/auth/schedule-deletion
 * @access  Private
 */
export const scheduleDeletion = async (req, res) => {
    try {
        // 1. Calculate the date 30 days from now
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + 30);

        // 2. Update the user record
        const user = await User.findByIdAndUpdate(
            req.user._id, 
            { deletionScheduledDate: deletionDate },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 3. Clear the authentication cookie to log them out immediately
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'strict'
        });

        // 4. Send the confirmation
        res.json({ 
            success: true, 
            message: "Your account has been scheduled for permanent deletion in 30 days. You have been logged out." 
        });

    } catch (error) {
        console.error(`Deletion Error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: "Could not process deletion request. Please try again later." 
        });
    }
};