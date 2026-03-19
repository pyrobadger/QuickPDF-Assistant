require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

const database = require('./services/database');
//const fs = require('fs'); 
const path = require('path');

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Waitlist POST route
app.post('/api/waitlist', async (req, res) => {
    // Allow CORS for local testing if needed
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    const phone = req.body.phone;
    if (!phone) return res.status(400).json({ error: 'Phone number missing' });

    // Sanitize and validate - must be exactly 10 digits to prevent injection
    const sanitizedPhone = String(phone).trim();
    if (!/^\d{10}$/.test(sanitizedPhone)) {
        return res.status(400).json({ error: 'Invalid phone number. Must be exactly 10 digits.' });
    }

    try {
        const saved = await database.saveToWaitlist(sanitizedPhone);
        if (saved) {
            res.json({ success: true, message: 'Saved to waitlist' });
        } else {
            res.json({ success: true, message: 'Already on waitlist' });
        }
    } catch (err) {
        console.error('Failed to save to waitlist DB:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// For CORS preflight (OPTIONS)
app.options('/api/waitlist', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.send();
});

// Import webhook routes
const webhookRoutes = require('./routes/webhook');
app.use('/webhook', webhookRoutes);

// Export for Vercel
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}