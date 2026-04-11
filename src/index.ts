import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import type { Request, Response } from "express";
import * as database from './services/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import webhookRoutes from './routes/webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Waitlist POST route
app.post('/api/waitlist', async (req: Request, res: Response) => {
    // Allow CORS for local testing if needed
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    const phone = req.body.phone;
    if (!phone) {
        res.status(400).json({ error: 'Phone number missing' });
        return;
    }

    // Sanitize and validate - must be exactly 10 digits to prevent injection
    const sanitizedPhone = String(phone).trim();
    if (!/^\d{10}$/.test(sanitizedPhone)) {
        res.status(400).json({ error: 'Invalid phone number. Must be exactly 10 digits.' });
        return;
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
        res.status(500).json({ error: 'Server error' });
    }
});

// For CORS preflight (OPTIONS)
app.options('/api/waitlist', (req: Request, res: Response) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.send();
});

// Import webhook routes
app.use('/webhook', webhookRoutes);

// Export for Vercel
export default app;

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}