import User from "../models/User.js";

export const scheduleDeletion = async (req, res) => {
  try {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { deletionScheduledDate: deletionDate },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
    });

    return res.json({
      success: true,
      message:
        "Your account has been scheduled for permanent deletion in 30 days. You have been logged out.",
    });
  } catch (error) {
    console.error("Deletion Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not process deletion request. Please try again later.",
    });
  }
};
