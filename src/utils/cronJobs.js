import cron from 'node-cron';
import User from '../models/User.js';

export const startCronJobs = () => {
    // Runs every day at midnight
    cron.schedule('0 0 * * *', async () => {
        const now = new Date();

        // 1. Delete users scheduled for deletion (8. User deleted account)
        await User.deleteMany({ deletionScheduledDate: { $lte: now } });

        // 2. Auto-delete inactive users (90 days)
        const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
        await User.deleteMany({ 
            lastActive: { $lte: ninetyDaysAgo }, 
            role: 'customer' 
        });
        
        console.log('Daily cleanup completed.');
    });
};