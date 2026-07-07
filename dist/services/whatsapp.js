import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
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
        }
        catch (error) {
            console.error('Failed to send text message:', error.response ? error.response.data : error.message);
        }
    }
    async sendTemplateMessage(to, templateName, languageCode = 'en', bodyVariables = [], buttonVariables = []) {
        try {
            const components = [];
            if (bodyVariables.length > 0) {
                components.push({
                    type: 'body',
                    parameters: bodyVariables.map(val => ({
                        type: 'text',
                        text: val
                    }))
                });
            }
            if (buttonVariables.length > 0) {
                components.push({
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: buttonVariables.map(val => ({
                        type: 'text',
                        text: val
                    }))
                });
            }
            await axios({
                method: 'POST',
                url: `${BASE_URL}${process.env.PHONE_NUMBER_ID}/messages`,
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: {
                            code: languageCode
                        },
                        ...(components.length > 0 && { components })
                    }
                },
                headers: getHeaders()
            });
            console.log(`[WhatsAppService] Successfully sent template '${templateName}' to ${to} (lang: ${languageCode})`);
            return true;
        }
        catch (error) {
            console.error(`[WhatsAppService] Failed to send template '${templateName}' (lang: ${languageCode}):`, error.response ? JSON.stringify(error.response.data) : error.message);
            // If we tried sending buttonVariables and it failed (e.g. template doesn't expect button component), retry without button component
            if (buttonVariables.length > 0) {
                console.log(`[WhatsAppService] Retrying template '${templateName}' without button component...`);
                return await this.sendTemplateMessage(to, templateName, languageCode, bodyVariables, []);
            }
            // If languageCode was 'en' and failed, maybe it was created as 'en_US' or 'en_GB'
            if (languageCode === 'en') {
                console.log(`[WhatsAppService] Retrying template '${templateName}' with language code 'en_US'...`);
                return await this.sendTemplateMessage(to, templateName, 'en_US', bodyVariables, []);
            }
            else if (languageCode === 'en_US') {
                console.log(`[WhatsAppService] Retrying template '${templateName}' with language code 'en_GB'...`);
                return await this.sendTemplateMessage(to, templateName, 'en_GB', bodyVariables, []);
            }
            return false;
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
                    if (!error)
                        resolve(destinationPath);
                });
            });
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Failed to send image:', error.response ? error.response.data : error.message);
        }
    }
}
export default new WhatsAppService();
