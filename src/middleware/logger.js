import AuditLog from '../models/AuditLog.js';

export const systemLogger = async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function (body) {
        // Only log meaningful actions or auth attempts
        if (req.user || req.body.email) {
            const ua = req.headers['user-agent'] || 'Unknown';
            
            const logEntry = {
                username: req.user ? req.user.username : (req.body.email || 'Anonymous'),
                ip: req.ip || req.connection.remoteAddress,
                device: /Mobile|Android|iPhone/i.test(ua) ? 'Mobile' : 'Desktop',
                browser: ua.split(' ').pop() || 'Unknown',
                action: `${req.method} ${req.originalUrl}`,
                status: res.statusCode,
                location: 'Nigeria' 
            };
            
            // Asynchronous logging - don't block the response
            AuditLog.create(logEntry).catch(err => console.error('Logging Failure:', err.message));
        }
        originalSend.call(this, body);
    };
    next();
};