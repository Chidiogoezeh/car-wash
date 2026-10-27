import cron from "node-cron";
import User from "../models/User.js";

export const startCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    await User.deleteMany({ deletionScheduledDate: { $lte: now } });
    await User.deleteMany({
      lastActive: { $lte: ninetyDaysAgo },
      role: "customer",
    });

    console.log("Daily cleanup completed.");
  });
};
