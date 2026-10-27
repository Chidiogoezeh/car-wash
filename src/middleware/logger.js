import AuditLog from "../models/AuditLog.js";

export const systemLogger = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (body) {
    if (req.user || req.body?.email) {
      const ua = req.headers["user-agent"] || "Unknown";

      AuditLog.create({
        username: req.user?.username || req.body.email || "Anonymous",
        ip: req.ip || req.connection.remoteAddress,
        device: /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop",
        browser: ua.split(" ").pop() || "Unknown",
        action: `${req.method} ${req.originalUrl}`,
        status: res.statusCode,
        location: "Nigeria",
      }).catch((err) => console.error("Logging Failure:", err.message));
    }

    return originalSend.call(this, body);
  };

  next();
};
