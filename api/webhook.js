const botController = require('../controllers/botController');

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                res.status(403).send('Forbidden');
            }
        } else {
            res.status(400).send('Bad Request');
        }
    } else if (req.method === 'POST') {
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
                const from = body.entry[0].changes[0].value.messages[0].from;
                const msg = body.entry[0].changes[0].value.messages[0];

                console.log(`Received message from ${from}`);

                // Process the message asynchronously
                // We don't await because Vercel functions might timeout if pdf processing takes too long,
                // but WhatsApp requires a 200 OK immediately.
                botController.handleIncomingMessage(phoneNumberId, from, msg).catch(err => {
                    console.error('Background processing error:', err);
                });
                
                // Acknowledge receipt immediately to Meta
                res.status(200).send('EVENT_RECEIVED');
            } else {
                // Acknowledge other types of updates (statuses, etc.)
                res.status(200).send('EVENT_RECEIVED');
            }
        } else {
            res.status(404).send('Not Found');
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
