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

// Import webhook routes
const webhookRoutes = require('./routes/webhook');
app.use('/webhook', webhookRoutes);

// Start background cleanup job for /tmp folder
const cleanupService = require('./services/cleanup');
cleanupService.startCleanupJob();

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
