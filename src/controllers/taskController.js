import Order from "../models/Order.js";
import User from "../models/User.js";
import { sendStatusEmail } from "../utils/mailer.js";

export const getMyTasks = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const tasks = await Order.find({ attendant: req.user._id })
      .populate("service", "name price")
      .sort("-createdAt");

    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error("[Fetch Tasks Error]:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error fetching your tasks" });
  }
};

export const assignAttendant = async (req, res) => {
  try {
    const { attendantId } = req.body;

    if (!attendantId) {
      return res
        .status(400)
        .json({ success: false, message: "Please select an attendant" });
    }

    const attendant = await User.findById(attendantId);

    if (!attendant || attendant.role !== "attendant") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid attendant selection" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { attendant: attendantId, status: "assigned" },
      { new: true, runValidators: true },
    ).populate("customer attendant service");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      message: `Order assigned to ${attendant.username}`,
      data: order,
    });
  } catch (err) {
    console.error("[Assign Task Error]:", err.message);
    res.status(500).json({ success: false, message: "Failed to assign task" });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const newStatus = req.body.status || "completed";

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true },
    ).populate("customer service");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (newStatus === "completed" && order.customer?.email) {
      sendStatusEmail(
        order.customer.email,
        order.vehiclePlate,
        "completed",
      ).catch((err) => console.error("[Mailer Error]:", err.message));
    }

    res.json({
      success: true,
      message: `Status updated to ${newStatus.toUpperCase()}`,
      data: order,
    });
  } catch (err) {
    console.error("[Status Update Error]:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update task status" });
  }
};
