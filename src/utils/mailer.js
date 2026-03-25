import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Requirement: Must be a Gmail App Password
    }
});

/**
 * @desc    Sends real-time status updates to customers
 * @param   {string} to - Customer email address
 * @param   {string} plate - Vehicle plate number
 * @param   {string} status - Current wash status (e.g., 'completed', 'started')
 */
export const sendStatusEmail = async (to, plate, status) => {
    // 1. Safety Check: Ensure credentials exist in .env
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("[Mailer]: Missing email credentials. Skipping email dispatch.");
        return;
    }

    // 2. Branding & Content Logic (Updated for "Car Wash Management System")
    const subject = "Car Wash Management System: Your Vehicle Update";
    
    // Requirement: Notify user they can exit after payment
    const text = status === 'completed' 
        ? `Great news! Your vehicle (${plate}) is ready for pickup. Please proceed to payment to exit with your vehicle.` 
        : `Your vehicle (${plate}) wash status has been updated to: ${status}.`;

    try {
        // 3. Dispatch Email
        await transporter.sendMail({
            from: `"Car Wash Management" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        });
        
        console.log(`[Mailer]: Status email successfully sent to ${to}`);
    } catch (err) {
        // Local Error Handling
        console.error(`[Mailer Error]: Failed to send to ${to} - ${err.message}`);
    }
};