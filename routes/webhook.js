const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');

// Webhook Verification (GET)
// Required by Meta to verify the callback URL
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// Incoming Messages (POST)
router.post('/', async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
            const from = body.entry[0].changes[0].value.messages[0].from; // sender phone number
            const msg = body.entry[0].changes[0].value.messages[0];

            console.log(`Received message from ${from}`);

            // Acknowledge receipt immediately
            res.sendStatus(200);

            // Process the message asynchronously
            await botController.handleIncomingMessage(phoneNumberId, from, msg);
        } else {
            // Acknowledge other types of updates (statuses, etc.)
            res.sendStatus(200);
        }
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;
