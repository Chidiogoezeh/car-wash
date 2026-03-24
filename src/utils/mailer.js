import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Note: This must be an App Password for Gmail
    }
});

/**
 * @desc    Sends status updates to customers
 */
export const sendStatusEmail = async (to, plate, status) => {
    // Validate that we have the necessary credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("[Mailer]: Missing email credentials. Skipping email dispatch.");
        return;
    }

    const subject = "Sparkle Car Wash: Your Vehicle Update";
    const text = status === 'completed' 
        ? `Great news! Your vehicle (${plate}) is ready for pickup. Please proceed to the payment counter.` 
        : `Your car wash booking for ${plate} has been updated to: ${status}.`;

    try {
        await transporter.sendMail({
            from: `"Sparkle Car Wash" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        });
        console.log(`[Mailer]: Status email sent to ${to}`);
    } catch (err) {
        console.error("[Mailer Error]:", err.message);
    }
};