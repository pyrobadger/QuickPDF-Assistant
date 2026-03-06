require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
    res.send('QuickPDF Assistant is running.');
});

// Waitlist POST route
const fs = require('fs');
const path = require('path');
app.post('/api/waitlist', (req, res) => {
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

    // Append to CSV file (creates it if it doesn't exist)
    const csvLine = `"${sanitizedPhone}","${new Date().toISOString()}"\n`;
    const filePath = path.join(__dirname, 'waitlist.csv');

    // Add header if file doesn't exist
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, 'Phone,DateSubmitted\n', 'utf8');
    }

    fs.appendFile(filePath, csvLine, (err) => {
        if (err) {
            console.error('Failed to save to waitlist.csv:', err);
            return res.status(500).json({ error: 'Server error' });
        }
        res.json({ success: true, message: 'Saved to waitlist' });
    });
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

// Start background cleanup job for /tmp folder
const cleanupService = require('./services/cleanup');
cleanupService.startCleanupJob();

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
