import Order from "../models/Order.js";

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const { service, vehiclePlate, slot } = req.body;

    if (!service || !vehiclePlate || !slot) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields: service, slot, and plate number.",
      });
    }

    const order = await Order.create({
      customer: req.user._id,
      service,
      vehiclePlate,
      slot,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Booking successful!",
      data: order,
    });
  } catch (err) {
    console.error("[Create Order Error]:", err.message);
    return res.status(400).json({
      success: false,
      message: "Booking failed. Please try again.",
    });
  }
};

// GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate("service")
      .sort("-createdAt");

    return res.json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching your order history.",
    });
  }
};

// PATCH /api/orders/paid/:id
export const markAsPaid = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, customer: req.user._id },
      { status: "completed" },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or unauthorized.",
      });
    }

    return res.json({
      success: true,
      message: "Admin notified of payment. Please wait for confirmation.",
    });
  } catch (err) {
    console.error("[Mark As Paid Error]:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment notification status.",
    });
  }
};
