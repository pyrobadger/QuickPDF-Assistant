import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import type { Request, Response } from "express";
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

// Import webhook routes
app.use('/webhook', webhookRoutes);

// Export for Vercel
export default app;

// We don't want to call app.listen() if Vercel is importing it as a serverless function
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}