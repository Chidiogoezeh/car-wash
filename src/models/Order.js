import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attendant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    slot: { type: String, required: true },
    vehiclePlate: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "assigned", "started", "completed", "paid"],
      default: "pending",
    },
    paymentConfirmed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
