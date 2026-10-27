import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    username: String,
    action: String,
    device: String,
    browser: String,
    ip: String,
    location: { type: String, default: "Nigeria" },
    status: Number,
  },
  { timestamps: true },
);

export default mongoose.models.AuditLog ||
  mongoose.model("AuditLog", auditLogSchema);
