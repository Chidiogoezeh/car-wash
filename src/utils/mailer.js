import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const { EMAIL_USER, EMAIL_PASS } = process.env;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

export const sendStatusEmail = async (to, plate, status) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn(
      "[Mailer]: Missing email credentials. Skipping email dispatch.",
    );
    return;
  }

  const subject = "Car Wash Management System: Your Vehicle Update";
  const text =
    status === "completed"
      ? `Great news! Your vehicle (${plate}) is ready for pickup. Please proceed to payment to exit with your vehicle.`
      : `Your vehicle (${plate}) wash status has been updated to: ${status}.`;

  try {
    await transporter.sendMail({
      from: `"Car Wash Management" <${EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log(`[Mailer]: Status email successfully sent to ${to}`);
  } catch (err) {
    console.error(`[Mailer Error]: Failed to send to ${to} - ${err.message}`);
  }
};
