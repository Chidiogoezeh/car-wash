import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendStatusEmail = async (to, plate, status) => {
    const message = status === 'completed' 
        ? `Your vehicle (${plate}) is ready! Please proceed to payment.` 
        : `Your wash for ${plate} has been ${status}.`;

    try {
        await transporter.sendMail({
            from: '"Sparkle Car Wash" <no-reply@carwash.com>',
            to,
            subject: "Car Wash Update",
            text: message
        });
    } catch (err) {
        console.error("Email Error:", err);
    }
};