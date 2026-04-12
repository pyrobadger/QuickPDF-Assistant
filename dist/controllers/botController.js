import whatsappService from '../services/whatsapp.js';
import sessionService from '../services/session.js';
import pdfWorker from '../services/pdfWorker.js';
import * as database from '../services/database.js';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
class BotController {
    async handleIncomingMessage(phoneNumberId, from, msg) {
        let session = sessionService.getSession(from);
        try {
            if (sessionService.isFirstTimeUser(from)) {
                await this.sendOnboardingMessage(from);
                // We keep going so they still get processed or see the menu
            }
            if (msg.type === 'text') {
                const text = msg.text.body.toLowerCase().trim();
                if (text === 'clear' || text === 'reset') {
                    sessionService.clearSession(from);
                    await whatsappService.sendTextMessage(from, '🧹 Your session has been cleared. Type "menu" to start a new task. ✨');
                    return;
                }
                // Always reset on 'hi' or 'menu'
                if (text === 'hi' || text === 'hello' || text === 'menu') {
                    sessionService.clearSession(from);
                    await this.sendMainMenu(from);
                    return;
                }
                // Handle text inputs based on state
                await this.handleTextState(from, text, session);
            }
            else if ((msg.type === 'document' && msg.document) || (msg.type === 'image' && msg.image)) {
                const mediaObject = msg.type === 'document' ? msg.document : msg.image;
                await this.handleDocument(from, mediaObject, session, msg.type);
            }
            else if (msg.type === 'interactive') {
                const interactive = msg.interactive;
                let actionId = null;
                if (interactive.type === 'list_reply') {
                    actionId = interactive.list_reply.id;
                }
                else if (interactive.type === 'button_reply') {
                    actionId = interactive.button_reply.id;
                }
                if (actionId) {
                    await this.handleInteractiveSelection(from, actionId, session);
                }
            }
            else {
                if (msg.type === 'unsupported' || session.stage === 'collecting_images' || session.stage === 'collecting_merge_files') {
                    return;
                }
                await whatsappService.sendTextMessage(from, '🤔 I only understand text, image, and document messages. Type "menu" to start. 🚀');
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
            await whatsappService.sendTextMessage(from, '⚠️ Sorry, something went wrong processing your request. Please try again later. 🛠️');
            sessionService.clearSession(from);
        }
    }
    async sendOnboardingMessage(to) {
        const welcomeMessage = "👋 Welcome to QuickPDF!\n\n" +
            "The easiest way to work with PDFs — right here on WhatsApp. No apps, no browser, no ads.\n\n" +
            "Just send any PDF or image and I'll help you:\n" +
            "📎 Merge, Split & Compress PDFs\n" +
            "🔄 Convert PDF ↔ Word, PowerPoint, Images\n" +
            "🔒 Protect or Unlock PDFs\n" +
            "🖼️ Combine multiple images into one PDF\n\n" +
            "Type *menu* anytime to get started. 🚀";
        await whatsappService.sendTextMessage(to, welcomeMessage);
    }
    async sendMainMenu(to) {
        const bodyText = '📄 What would you like to do?';
        const buttonText = 'Options';
        const title = 'QuickPDF Menu';
        const sections = [
            {
                title: 'File Operations',
                rows: [
                    { id: 'menu_merge', title: '🔗 Merge PDFs', description: 'Combine multiple PDFs into one' },
                    { id: 'menu_split', title: '✂️ Split PDF', description: 'Extract pages from a PDF' },
                    { id: 'menu_compress', title: '🗜️ Compress PDF', description: 'Reduce PDF file size' },
                    { id: 'menu_convert', title: '🔄 Convert File', description: 'Convert files between PDF, Word, PowerPoint & image formats' }
                ]
            },
            {
                title: 'Security',
                rows: [
                    { id: 'menu_protect', title: '🔐 Protect PDF', description: 'Add password to PDF' },
                    { id: 'menu_unlock', title: '🔓 Unlock PDF', description: 'Remove password' }
                ]
            }
        ];
        await whatsappService.sendListMessage(to, bodyText, buttonText, sections, title);
    }
    async handleInteractiveSelection(from, actionId, session) {
        console.log(`User ${from} selected action: ${actionId}`);
        // Log menu selection
        await database.logInteraction(from, 'menu_selection', { selectedId: actionId });
        const usage = sessionService.getDailyUsage(from);
        if (usage >= 5) {
            await whatsappService.sendTextMessage(from, '⏳ You have reached the free beta limit of 5 operations per day. Please try again tomorrow. 🌛');
            return;
        }
        if (actionId === 'action_merge_done') {
            if (session.action === 'menu_merge' && session.files.length >= 2) {
                await this.processMerge(from, session);
            }
            else {
                await whatsappService.sendTextMessage(from, '📎 You need to upload at least 2 PDFs first! 📄📄');
            }
            return;
        }
        if (actionId === 'action_images_done') {
            if (session.action === 'convert_images_to_pdf' && session.files.length >= 1) {
                await this.processConversion(from, session);
            }
            else {
                await whatsappService.sendTextMessage(from, '🖼️ You need to upload at least 1 image first! 📸');
            }
            return;
        }
        session.action = actionId;
        session.files = [];
        session.metadata.orderedFiles = [];
        session.metadata.fileOrderCounter = 0;
        session.stage = 'awaiting_document';
        switch (actionId) {
            case 'menu_merge':
                await whatsappService.sendTextMessage(from, '🔗 You selected Merge PDFs.\nPlease upload 2 or more PDF files one by one. When done, tap "Done Merging". ✅');
                await whatsappService.sendReplyButtons(from, 'Are you finished uploading?', [{ id: 'action_merge_done', title: 'Done Merging' }]);
                session.stage = 'collecting_merge_files';
                break;
            case 'menu_compress':
                session.stage = 'awaiting_compression_level';
                await whatsappService.sendReplyButtons(from, 'Choose compression level:', [
                    { id: 'compress_low', title: 'Low (High Quality)' },
                    { id: 'compress_medium', title: 'Medium' },
                    { id: 'compress_high', title: 'High (Smallest)' }
                ]);
                break;
            case 'compress_low':
            case 'compress_medium':
            case 'compress_high':
                session.metadata.compressLevel = actionId.split('_')[1]; // low, medium, or high
                session.stage = 'awaiting_document';
                await whatsappService.sendTextMessage(from, `🗜️ Compression set to ${session.metadata.compressLevel}. Please upload the PDF to compress. 📉`);
                break;
            case 'menu_split':
                session.stage = 'awaiting_document';
                await whatsappService.sendTextMessage(from, '✂️ You selected Split PDF.\nPlease upload the PDF you want to split. 📄');
                break;
            case 'menu_convert':
                session.stage = 'awaiting_convert_type';
                await whatsappService.sendListMessage(from, 'What do you want to convert?', 'Options', [
                    {
                        title: '📄 Documents',
                        rows: [
                            { id: 'convert_docx_to_pdf', title: '📝 DOCX to PDF', description: 'Convert Word to PDF' },
                            { id: 'convert_pdf_to_docx', title: '📄 PDF to DOCX', description: 'Convert PDF to Word' },
                            { id: 'convert_pptx_to_pdf', title: '📊 PPTX to PDF', description: 'Convert PowerPoint to PDF' }
                        ]
                    },
                    {
                        title: '🖼️ Images',
                        rows: [
                            { id: 'convert_pdf_to_jpg', title: '📄➡️🖼️ PDF to JPG', description: 'Convert first page to Image' },
                            { id: 'convert_images_to_pdf', title: '🖼️➡️📄 Images to PDF', description: 'Convert one or more JPG/PNG images to PDF' }
                        ]
                    }
                ], 'Convert options');
                break;
            case 'convert_pdf_to_jpg':
            case 'convert_docx_to_pdf':
            case 'convert_pdf_to_docx':
            case 'convert_pptx_to_pdf':
                session.metadata.convertType = actionId;
                session.stage = 'awaiting_document';
                await whatsappService.sendTextMessage(from, `🔄 Please upload the file to convert. 📂`);
                break;
            case 'convert_images_to_pdf':
                session.metadata.convertType = actionId;
                await whatsappService.sendTextMessage(from, '🖼️➡️📄 You selected Images to PDF.\nSend your images. When done, tap "Done". ✅');
                await whatsappService.sendReplyButtons(from, 'Are you finished uploading?', [{ id: 'action_images_done', title: 'Done' }]);
                session.stage = 'collecting_images';
                break;
            case 'menu_protect':
                session.stage = 'awaiting_document';
                await whatsappService.sendTextMessage(from, '🔐 You selected Protect PDF.\nPlease upload the PDF you want to password protect. 🛡️');
                break;
            case 'menu_unlock':
                session.stage = 'awaiting_document';
                await whatsappService.sendTextMessage(from, '🔓 You selected Unlock PDF.\nPlease upload the PDF you want to unlock. 📁');
                break;
            default:
                await whatsappService.sendTextMessage(from, '❓ Unknown action selected. Send "menu" to restart. 🔄');
                sessionService.clearSession(from);
                return;
        }
        sessionService.updateSession(from, session);
    }
    async handleTextState(from, text, session) {
        if (session.stage === 'awaiting_split_range') {
            const range = text.toUpperCase();
            await whatsappService.sendTextMessage(from, '⚙️ Processing split... this may take a moment. ⏳');
            try {
                const inputPath = session.files[0];
                const outputPath = path.join('/tmp', `${crypto.randomUUID()}_split.pdf`);
                await pdfWorker.splitPdf(inputPath, outputPath, range);
                await this.sendResultAndCleanup(from, outputPath, 'application/pdf', 'document', 'Here is your split PDF.', session.metadata.originalName ? `${session.metadata.originalName}_split.pdf` : 'split.pdf', session.action);
            }
            catch (err) {
                await whatsappService.sendTextMessage(from, '❌ Invalid page range or processing failed. Please try again. 🔄');
            }
            sessionService.clearSession(from);
        }
        else if (session.stage === 'awaiting_password_protect') {
            await whatsappService.sendTextMessage(from, '🛡️ Securing your file... this may take a moment. 🔐');
            try {
                const inputPath = session.files[0];
                const outputPath = path.join('/tmp', `${crypto.randomUUID()}_protected.pdf`);
                await pdfWorker.protectPdf(inputPath, outputPath, text); // text is password
                // Note: user password text is logged in WA but we don't save it
                await this.sendResultAndCleanup(from, outputPath, 'application/pdf', 'document', 'Here is your protected PDF.', session.metadata.originalName ? `${session.metadata.originalName}_protected.pdf` : 'protected.pdf', session.action);
            }
            catch (err) {
                await whatsappService.sendTextMessage(from, '❌ Failed to protect PDF. ⚠️');
            }
            sessionService.clearSession(from);
        }
        else if (session.stage === 'awaiting_password_unlock') {
            await whatsappService.sendTextMessage(from, '🔓 Unlocking your file... this may take a moment. ⚙️');
            try {
                const inputPath = session.files[0];
                const outputPath = path.join('/tmp', `${crypto.randomUUID()}_unlocked.pdf`);
                await pdfWorker.unlockPdf(inputPath, outputPath, text);
                await this.sendResultAndCleanup(from, outputPath, 'application/pdf', 'document', 'Here is your unlocked PDF.', session.metadata.originalName ? `${session.metadata.originalName}_unlocked.pdf` : 'unlocked.pdf', session.action);
            }
            catch (err) {
                await whatsappService.sendTextMessage(from, '❌ Failed to unlock PDF. The password might be incorrect. 🔑');
            }
            sessionService.clearSession(from);
        }
        else {
            // Default catch-all
            await whatsappService.sendTextMessage(from, '👋 Please select an option from the menu or upload the requested file. Send "menu" to view options. 📋');
        }
    }
    async handleDocument(from, document, session, msgType) {
        if (!session.action || session.stage === 'idle') {
            if (msgType === 'image') {
                return; // Silently ignore race condition
            }
            await whatsappService.sendTextMessage(from, '🤔 I received a file, but I don\'t know what you want me to do with it. Please select an option from the menu first. 📑');
            await this.sendMainMenu(from);
            return;
        }
        // Only process acceptable MIME types
        const acceptableMimes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-powerpoint'
        ];
        if (!acceptableMimes.includes(document.mime_type)) {
            await whatsappService.sendTextMessage(from, '🚫 Unsupported file type. Please upload a PDF, Image, Word, or PowerPoint document. 📄🖼️');
            return;
        }
        // Synchronously capture order of arrival to preserve correct document sequence
        session = sessionService.getSession(from);
        session.metadata.fileOrderCounter = (session.metadata.fileOrderCounter || 0) + 1;
        const expectedOrder = session.metadata.fileOrderCounter;
        sessionService.updateSession(from, session);
        if (expectedOrder === 1) {
            await whatsappService.sendTextMessage(from, '📥 Receiving your file(s)... ⏳');
        }
        try {
            const mediaUrl = await whatsappService.getMediaUrl(document.id);
            let ext = '';
            if (document.mime_type === 'application/pdf')
                ext = '.pdf';
            else if (document.mime_type === 'image/jpeg')
                ext = '.jpg';
            else if (document.mime_type === 'image/png')
                ext = '.png';
            else if (document.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                ext = '.docx';
            else if (document.mime_type === 'application/msword')
                ext = '.doc';
            else if (document.mime_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
                ext = '.pptx';
            else if (document.mime_type === 'application/vnd.ms-powerpoint')
                ext = '.ppt';
            const localPath = path.join('/tmp', `${crypto.randomUUID()}${ext}`);
            await whatsappService.downloadMedia(mediaUrl, localPath);
            // Because WhatsApp might send multiple webhooks concurrently, fetch the freshest session state
            session = sessionService.getSession(from);
            if (document.filename) {
                const basename = path.basename(document.filename, path.extname(document.filename));
                session.metadata.originalName = basename;
            }
            // Check file size: 10 MiB for images, 40 MiB for other documents
            const imageMimes = ['image/jpeg', 'image/png'];
            const isImage = imageMimes.includes(document.mime_type);
            const FILE_SIZE_LIMIT = isImage ? 10 * 1024 * 1024 : 40 * 1024 * 1024;
            const stats = await fs.stat(localPath);
            if (stats.size > FILE_SIZE_LIMIT) {
                await fs.unlink(localPath).catch(() => { });
                const limitMsg = isImage
                    ? '⚠️ File is too large! The freemium plan limits images to 10 MB. 📉'
                    : '⚠️ File is too large! The freemium plan limits documents to 40 MB. 📉';
                await whatsappService.sendTextMessage(from, limitMsg);
                return;
            }
            // Fresh read -> mutate -> save immediately to avoid race conditions
            session.metadata.orderedFiles = session.metadata.orderedFiles || [];
            // Enforce max 20 images for a single conversion
            if (session.metadata.orderedFiles.length >= 20) {
                await fs.unlink(localPath).catch(() => { });
                await whatsappService.sendTextMessage(from, '🛑 You have reached the maximum of 20 images per PDF. Please finish or start a new conversion. 📁');
                return;
            }
            session.metadata.orderedFiles.push({ path: localPath, order: expectedOrder });
            session.metadata.orderedFiles.sort((a, b) => a.order - b.order);
            session.files = session.metadata.orderedFiles.map((f) => f.path);
            sessionService.updateSession(from, session);
            // React based on action and stage
            if (session.action === 'menu_merge' && session.stage === 'collecting_merge_files') {
                // Throttle "File received" messages directly to the interactive button prompt
                if (expectedOrder === 1 || expectedOrder % 5 === 0) {
                    await whatsappService.sendReplyButtons(from, `📥 Received ${session.files.length} file(s) so far. Upload more or tap "Done Merging".`, [{ id: 'action_merge_done', title: 'Done Merging' }]);
                }
            }
            else if (session.action === 'convert_images_to_pdf' && session.stage === 'collecting_images') {
                if (expectedOrder === 1 || expectedOrder % 5 === 0) {
                    await whatsappService.sendReplyButtons(from, `📸 Received ${session.files.length} image(s) so far. Send more or tap "Done".`, [{ id: 'action_images_done', title: 'Done' }]);
                }
            }
            else if (session.action === 'menu_compress' || session.action.startsWith('compress_')) {
                await this.processCompression(from, session);
            }
            else if (session.action === 'menu_split') {
                session.stage = 'awaiting_split_range';
                sessionService.updateSession(from, session);
                await whatsappService.sendTextMessage(from, '🔢 Enter the page range you want to extract (e.g., 2-5 or 1,3,4) or ALL: 📄');
            }
            else if ((session.action === 'menu_convert' || session.action.startsWith('convert_')) && session.stage !== 'collecting_images') {
                await this.processConversion(from, session);
            }
            else if (session.action === 'menu_protect') {
                session.stage = 'awaiting_password_protect';
                sessionService.updateSession(from, session);
                await whatsappService.sendTextMessage(from, '🔑 Please type the password you want to use to protect this PDF: 🔒');
            }
            else if (session.action === 'menu_unlock') {
                session.stage = 'awaiting_password_unlock';
                sessionService.updateSession(from, session);
                await whatsappService.sendTextMessage(from, '🔑 Please type the current password to unlock this PDF: 🔓');
            }
        }
        catch (error) {
            console.error('Failed processing document upload:', error);
            await whatsappService.sendTextMessage(from, '❌ Failed to download your file. Please try again. 🔄');
        }
    }
    async processMerge(from, session) {
        await whatsappService.sendTextMessage(from, '🔗 Merging your files... this may take a moment. ⏳');
        try {
            const outputPath = path.join('/tmp', `${crypto.randomUUID()}_merged.pdf`);
            await pdfWorker.mergePdfs(session.files, outputPath);
            await this.sendResultAndCleanup(from, outputPath, 'application/pdf', 'document', 'Here is your merged PDF.', 'merged.pdf', session.action);
        }
        catch (error) {
            console.error('Merge error:', error);
            await whatsappService.sendTextMessage(from, '❌ Failed to merge files. Ensure they are valid PDFs. 📄');
        }
        sessionService.clearSession(from);
    }
    async processCompression(from, session) {
        await whatsappService.sendTextMessage(from, '🗜️ Compressing your file... this may take a moment. ⏳');
        try {
            const inputPath = session.files[0];
            const outputPath = path.join('/tmp', `${crypto.randomUUID()}_compressed.pdf`);
            // Map our sizes to Ghostscript PDFSETTINGS
            let gsLevel = 'ebook'; // medium
            if (session.metadata.compressLevel === 'low')
                gsLevel = 'printer'; // high quality
            if (session.metadata.compressLevel === 'high')
                gsLevel = 'screen'; // smallest
            await pdfWorker.compressPdf(inputPath, outputPath, gsLevel);
            // Get file sizes for comparison
            const statsOrig = await fs.stat(inputPath);
            const statsNew = await fs.stat(outputPath);
            const origMb = (statsOrig.size / (1024 * 1024)).toFixed(1);
            const newMb = (statsNew.size / (1024 * 1024)).toFixed(1);
            await this.sendResultAndCleanup(from, outputPath, 'application/pdf', 'document', `✅ Successfully compressed from ${origMb}MB to ${newMb}MB! 📉`, session.metadata.originalName ? `${session.metadata.originalName}_compressed.pdf` : 'compressed.pdf', session.action);
        }
        catch (error) {
            console.error('Compression error:', error);
            await whatsappService.sendTextMessage(from, '❌ Failed to compress the file. ⚠️');
        }
        sessionService.clearSession(from);
    }
    async processConversion(from, session) {
        await whatsappService.sendTextMessage(from, '🔄 Converting your file... this may take a moment. ⏳');
        try {
            const inputPath = session.files[0];
            const type = session.metadata.convertType;
            if (type === 'convert_pdf_to_jpg') {
                // Returns directory path containing the converted JPEGs
                const outputDir = path.join('/tmp', crypto.randomUUID());
                await fs.mkdir(outputDir);
                try {
                    await pdfWorker.convertPdfToImage(inputPath, outputDir);
                    // Read dir and send all images
                    const images = await fs.readdir(outputDir);
                    // Sort them logically (page-1.jpg, page-2.jpg etc)
                    images.sort((a, b) => {
                        const numA = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
                        const numB = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
                        return numA - numB;
                    });
                    if (images.length > 0) {
                        for (let i = 0; i < images.length; i++) {
                            const imgName = images[i];
                            if (!imgName)
                                continue;
                            const imagePath = path.join(outputDir, imgName);
                            // Use the underlying sendResultAndCleanup logic to send each file,
                            try {
                                const mediaId = await whatsappService.uploadMedia(imagePath, 'image');
                                await whatsappService.sendImageId(from, mediaId);
                            }
                            catch (e) {
                                console.error(`Failed to send ${imgName}`, e);
                            }
                        }
                        // Send completion summary
                        await whatsappService.sendTextMessage(from, `✅ Done! ${images.length} pages sent! 🖼️`);
                        // Log PDF to JPG completion
                        await database.logInteraction(from, session.action, {
                            pageCount: images.length,
                            status: 'success'
                        });
                        // Cleanup the whole directory manually
                        try {
                            for (const img of images) {
                                await fs.unlink(path.join(outputDir, img)).catch(() => { });
                            }
                            await fs.rmdir(outputDir).catch(() => { });
                        }
                        catch (e) {
                            console.error('Failed to clear tmp dir', e);
                        }
                    }
                    else {
                        throw new Error('No images generated');
                    }
                    sessionService.clearSession(from);
                }
                catch (pdfErr) {
                    if (pdfErr.message && pdfErr.message.startsWith('MAX_PAGES_EXCEEDED')) {
                        const count = pdfErr.message.split(':')[1];
                        await whatsappService.sendTextMessage(from, `⚠️ This PDF has ${count} pages. PDF to JPG supports a maximum of 10 pages. 📄`);
                        await fs.rm(outputDir, { recursive: true, force: true }).catch(() => { });
                        sessionService.clearSession(from);
                        return; // Stop processing and avoid the generic error message
                    }
                    throw pdfErr; // Re-throw to be caught by the general block
                }
            }
            else if (type === 'convert_docx_to_pdf' || type === 'convert_pptx_to_pdf') {
                const outputDir = path.join('/tmp');
                const outputPath = await pdfWorker.convertDocxToPdf(inputPath, outputDir);
                await this.sendResultAndCleanup(from, outputPath, 'application/pdf', 'document', 'Here is your converted PDF.', session.metadata.originalName ? `${session.metadata.originalName}.pdf` : 'converted.pdf', session.action);
            }
            else if (type === 'convert_pdf_to_docx') {
                const outputDir = path.join('/tmp');
                const outputPath = await pdfWorker.convertPdfToDocx(inputPath, outputDir);
                await this.sendResultAndCleanup(from, outputPath, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'document', 'Here is your converted Word document.', session.metadata.originalName ? `${session.metadata.originalName}.docx` : 'converted.docx', session.action);
            }
            else if (type === 'convert_images_to_pdf') {
                const outputPath = path.join('/tmp', `${crypto.randomUUID()}_images_converted.pdf`);
                await pdfWorker.convertImagesToPdf(session.files, outputPath);
                await this.sendResultAndCleanup(from, outputPath, 'application/pdf', 'document', 'Here is your merged image PDF.', 'images.pdf', session.action);
            }
        }
        catch (error) {
            console.error('Conversion error:', error);
            await whatsappService.sendTextMessage(from, '❌ Failed to convert the file. ⚠️');
        }
        sessionService.clearSession(from);
    }
    async sendResultAndCleanup(to, filePath, mimeType, type = 'document', caption = '', outputFilename = null, action = 'unknown') {
        try {
            const stats = await fs.stat(filePath);
            const fileSizeMb = (stats.size / (1024 * 1024)).toFixed(2);
            // Log the interaction
            await database.logInteraction(to, action, {
                fileSizeMb: parseFloat(fileSizeMb),
                mimeType: mimeType,
                status: 'success'
            });
            const usage = sessionService.incrementDailyUsage(to);
            console.log(`User ${to} has used ${usage} operations today.`);
            console.log(`Uploading processed file to WhatsApp: ${filePath}`);
            const mediaId = await whatsappService.uploadMedia(filePath, type);
            const finalName = outputFilename || path.basename(filePath);
            const watermarkedCaption = `${caption ? caption + '\n\n' : ''}✨ Processed by *QuickPDF Assistant* 📄\n🌐 www.quickpdfassistant.in`;
            console.log(`Sending document ${mediaId} to ${to}`);
            await whatsappService.sendDocumentId(to, mediaId, finalName, watermarkedCaption);
        }
        catch (error) {
            console.error('Error sending resulting document:', error);
            await whatsappService.sendTextMessage(to, '⚠️ Processed your request but failed to send the resulting file. 🛠️');
        }
        // Fire and forget cleanup (could be moved to a cron job in a real app)
        try {
            // we will let cron job handle it ideally, but for now we manually delete just the result file
            await fs.unlink(filePath).catch(() => { });
        }
        catch (e) { }
    }
}
export default new BotController();
