import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import type { Request, Response } from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import webhookRoutes from './routes/webhook.js';
import { createSubscription, verifySignature } from './services/payment.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON (except for webhook where we need raw body)
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/webhook/razorpay')) {
        next();
    } else {
        express.json()(req, res, next);
    }
});

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Import webhook routes
app.use('/webhook', webhookRoutes);

// --- Razorpay Endpoints ---

import * as database from './services/database.js';

app.post('/api/create-subscription', async (req: Request, res: Response): Promise<void> => {
    try {
        let { phone } = req.body;
        if (!phone) {
            res.status(400).json({ error: 'WhatsApp number is required' });
            return;
        }

        // Normalize phone number to match WhatsApp Cloud API format (e.g., 919876543210)
        phone = phone.replace(/\D/g, ''); // Strip all non-numeric characters like +, -, spaces
        if (phone.length === 10) {
            phone = '91' + phone; // Assume India country code if exactly 10 digits
        } else if (phone.length === 11 && phone.startsWith('0')) {
            phone = '91' + phone.substring(1); // Handle leading zero
        }

        const isPro = await database.isUserPro(phone);
        if (isPro) {
            res.status(400).json({ error: 'ALREADY_SUBSCRIBED', message: 'You are already subscribed to QuickPDF Pro!' });
            return;
        }

        const subscription = await createSubscription(phone);

        res.json({
            subscription_id: subscription.id,
            // Subscriptions do not return 'amount' in the same way, the frontend just needs the ID
        });
    } catch (error: any) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: 'Failed to create subscription: ' + (error.message || JSON.stringify(error)) });
    }
});

app.post('/api/verify-payment', (req: Request, res: Response): void => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            res.status(400).json({ error: 'Missing required payment fields' });
            return;
        }

        const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (isValid) {
            // Note: Currently marking as valid but not activating a specific subscription
            // since this is the standard order checkout flow.
            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

// Export for Vercel
export default app;

// We don't want to call app.listen() if Vercel is importing it as a serverless function
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}