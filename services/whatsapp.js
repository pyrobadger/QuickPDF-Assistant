const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Base URL for WhatsApp API
const BASE_URL = 'https://graph.facebook.com/v18.0/';

const getHeaders = () => ({
    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json'
});

class WhatsAppService {

    async sendTextMessage(to, text) {
        try {
            await axios({
                method: 'POST',
                url: `${BASE_URL}${process.env.PHONE_NUMBER_ID}/messages`,
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    text: { body: text }
                },
                headers: getHeaders()
            });
        } catch (error) {
            console.error('Failed to send text message:', error.response ? error.response.data : error.message);
        }
    }

    async sendListMessage(to, bodyText, buttonText, sections, title = 'Menu') {
        try {
            await axios({
                method: 'POST',
                url: `${BASE_URL}${process.env.PHONE_NUMBER_ID}/messages`,
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'interactive',
                    interactive: {
                        type: 'list',
                        header: {
                            type: 'text',
                            text: title
                        },
                        body: {
                            text: bodyText
                        },
                        action: {
                            button: buttonText,
                            sections: sections
                        }
                    }
                },
                headers: getHeaders()
            });
        } catch (error) {
            console.error('Failed to send list message:', error.response ? error.response.data : error.message);
        }
    }

    async sendReplyButtons(to, bodyText, buttons) {
        try {
            const actionButtons = buttons.map(btn => ({
                type: 'reply',
                reply: {
                    id: btn.id,
                    title: btn.title
                }
            }));

            await axios({
                method: 'POST',
                url: `${BASE_URL}${process.env.PHONE_NUMBER_ID}/messages`,
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        body: {
                            text: bodyText
                        },
                        action: {
                            buttons: actionButtons
                        }
                    }
                },
                headers: getHeaders()
            });
        } catch (error) {
            console.error('Failed to send reply buttons:', error.response ? error.response.data : error.message);
        }
    }

    async getMediaUrl(mediaId) {
        try {
            const response = await axios.get(`${BASE_URL}${mediaId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
                }
            });
            return response.data.url;
        } catch (error) {
            console.error('Failed to get media URL:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async downloadMedia(url, destinationPath) {
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Accept-Encoding': 'gzip, deflate, br'
                }
            });

            return new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(destinationPath);
                response.data.pipe(writer);
                let error = null;
                writer.on('error', err => {
                    error = err;
                    console.error('File write error:', err);
                    writer.close();
                    reject(err);
                });
                writer.on('finish', () => {
                    console.log('File successfully downloaded and saved to', destinationPath);
                    if (!error) resolve(destinationPath);
                });
            });
        } catch (error) {
            console.error('Failed to download media:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async uploadMedia(filePath, type = 'document') {
        const formData = new FormData();
        formData.append('messaging_product', 'whatsapp');
        formData.append('file', fs.createReadStream(filePath));
        formData.append('type', type);

        try {
            const response = await axios.post(`${BASE_URL}${process.env.PHONE_NUMBER_ID}/media`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
                }
            });
            return response.data.id;
        } catch (error) {
            console.error('Failed to upload media:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async sendDocumentId(to, mediaId, filename, caption = '') {
        try {
            await axios({
                method: 'POST',
                url: `${BASE_URL}${process.env.PHONE_NUMBER_ID}/messages`,
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'document',
                    document: {
                        id: mediaId,
                        filename: filename,
                        caption: caption
                    }
                },
                headers: getHeaders()
            });
        } catch (error) {
            console.error('Failed to send document:', error.response ? error.response.data : error.message);
        }
    }

    async sendImageId(to, mediaId) {
        try {
            await axios({
                method: 'POST',
                url: `${BASE_URL}${process.env.PHONE_NUMBER_ID}/messages`,
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'image',
                    image: {
                        id: mediaId
                    }
                },
                headers: getHeaders()
            });
        } catch (error) {
            console.error('Failed to send image:', error.response ? error.response.data : error.message);
        }
    }
}

module.exports = new WhatsAppService();
