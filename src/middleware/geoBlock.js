export const geoBlock = (req, res, next) => {
    // Determine the country (Cloudflare header or default to NG for local dev)
    const country = req.headers['cf-ipcountry'] || 'NG'; 

    // Location restricted to Nigeria
    if (process.env.NODE_ENV === 'production' && country !== 'NG') {
        return res.status(403).json({ 
            success: false,
            message: "Access restricted to Nigeria only." 
        });
    }

    next();
};