const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { exec } = require('child_process');
const util = require('util');
const sharp = require('sharp');
const execPromise = util.promisify(exec);

// Hardcoded Ghostscript Path based on User instruction
const gsCommand = process.platform === 'win32' ? '"C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe"' : 'gs';

// Hardcoded LibreOffice Path for DOCX conversion
const loCommand = process.platform === 'win32' ? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe' : 'soffice';

class PDFWorker {
    /**
     * Merge multiple PDF files into one.
     */
    async mergePdfs(filePaths, outputPath) {
        const mergedPdf = await PDFDocument.create();
        for (const filePath of filePaths) {
            const pdfBytes = await fs.readFile(filePath);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            if (pdfDoc.getPageCount() > 200) {
                throw new Error('PDF has too many pages (max 200 pages allowed)');
            }
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const mergedPdfBytes = await mergedPdf.save();
        await fs.writeFile(outputPath, mergedPdfBytes);
        return outputPath;
    }

    /**
     * Compress PDF using Ghostscript
     * level: screen (lowest size), ebook (medium), printer, prepress
     */
    async compressPdf(inputPath, outputPath, level = 'ebook') {
        const command = `${gsCommand} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${level} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
        try {
            await execPromise(command, { timeout: 30000 });
            return outputPath;
        } catch (error) {
            console.error('Ghostscript compression failed:', error);
            throw new Error('PDF Compression failed');
        }
    }

    /**
     * Split specific pages from a PDF.
     * range: '2-5' or '1,3,4' or 'ALL'
     */
    async splitPdf(inputPath, outputPath, range) {
        if (range.toUpperCase() === 'ALL') {
            // For simplify, ALL means copy the whole document. But usually split means something else.
            // We'll just copy it for now.
            await fs.copyFile(inputPath, outputPath);
            return outputPath;
        }

        const pdfBytes = await fs.readFile(inputPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        if (pdfDoc.getPageCount() > 200) {
            throw new Error('PDF has too many pages (max 200 pages allowed)');
        }
        const newDoc = await PDFDocument.create();

        // Parse range (e.g. "2-5", or "1,2")
        let pagesToInclude = new Set();
        const parts = range.split(',');
        for (let part of parts) {
            if (part.includes('-')) {
                let [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
                for (let i = start; i <= end; i++) {
                    pagesToInclude.add(i - 1); // 0-indexed
                }
            } else {
                pagesToInclude.add(parseInt(part.trim(), 10) - 1);
            }
        }

        const totalPages = pdfDoc.getPageCount();
        const validIndices = Array.from(pagesToInclude).filter(idx => idx >= 0 && idx < totalPages).sort((a, b) => a - b);

        if (validIndices.length === 0) throw new Error('Invalid page range');

        const copiedPages = await newDoc.copyPages(pdfDoc, validIndices);
        copiedPages.forEach((page) => newDoc.addPage(page));

        const newPdfBytes = await newDoc.save();
        await fs.writeFile(outputPath, newPdfBytes);
        return outputPath;
    }

    /**
     * Convert Image to PDF
     */
    async convertImageToPdf(inputPath, outputPath) {
        // We'll handle JPG/PNG and convert to a PDF with one page matching the image dimensions
        const pdfDoc = await PDFDocument.create();
        const imageBytes = await fs.readFile(inputPath);

        // determine type
        const ext = path.extname(inputPath).toLowerCase();
        let image;
        if (ext === '.jpg' || ext === '.jpeg') {
            image = await pdfDoc.embedJpg(imageBytes);
        } else if (ext === '.png') {
            image = await pdfDoc.embedPng(imageBytes);
        } else {
            throw new Error('Unsupported image type. Use JPG or PNG.');
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });

        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, pdfBytes);
        return outputPath;
    }

    /**
     * Convert Multiple Images to PDF
     */
    async convertImagesToPdf(inputPaths, outputPath) {
        if (!Array.isArray(inputPaths) || inputPaths.length === 0) {
            throw new Error('No input images provided.');
        }

        const pdfDoc = await PDFDocument.create();

        for (const inputPath of inputPaths) {
            const imageBytes = await fs.readFile(inputPath);
            const ext = path.extname(inputPath).toLowerCase();
            let image;

            if (ext === '.jpg' || ext === '.jpeg') {
                image = await pdfDoc.embedJpg(imageBytes);
            } else if (ext === '.png') {
                image = await pdfDoc.embedPng(imageBytes);
            } else {
                console.warn(`Skipping unsupported image type: ${inputPath}`);
                continue; // Skip unsupported
            }

            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, pdfBytes);
        return outputPath;
    }

    /**
     * Convert PDF to Image (first page as representation or all pages)
     * For MVP, we will extract the first page as a JPG using Ghostscript
     */
    async convertPdfToImage(inputPath, outputPatternDir) {
        // First check page count
        const pdfBytes = await fs.readFile(inputPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pageCount = pdfDoc.getPageCount();

        if (pageCount > 10) {
            throw new Error(`MAX_PAGES_EXCEEDED:${pageCount}`);
        }

        // Output format: outputDir/page-%d.jpg
        const outputPath = path.join(outputPatternDir, 'page-%d.jpg');
        const command = `${gsCommand} -dNOPAUSE -dQUIET -dBATCH -sDEVICE=jpeg -r150 -sOutputFile="${outputPath}" "${inputPath}"`;
        try {
            await execPromise(command, { timeout: 30000 });
            return outputPatternDir; // Will contain the JPGs
        } catch (error) {
            console.error('Ghostscript conversion failed:', error);
            throw new Error('PDF to Image Conversion failed');
        }
    }

    /**
     * Protect PDF with a password
     */
    async protectPdf(inputPath, outputPath, password) {
        // pdf-lib does NOT support encrypting PDFs directly as of typical usage.
        // We can use Ghostscript or qpdf to encrypt. For a WhatsApp bot, using Ghostscript:
        const command = `${gsCommand} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOwnerPassword="${password}" -sUserPassword="${password}" -sOutputFile="${outputPath}" "${inputPath}"`;
        try {
            await execPromise(command, { timeout: 30000 });
            return outputPath;
        } catch (error) {
            console.error('Ghostscript protection failed:', error);
            throw new Error('PDF Protection failed');
        }
    }

    /**
     * Unlock PDF with a password
     */
    async unlockPdf(inputPath, outputPath, password) {
        // Ghostscript can also decrypt if password is provided
        const command = `${gsCommand} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sPDFPassword="${password}" -sOutputFile="${outputPath}" "${inputPath}"`;
        try {
            await execPromise(command, { timeout: 30000 });
            return outputPath;
        } catch (error) {
            console.error('Ghostscript unlock failed (wrong password?):', error);
            throw new Error('PDF Unlock failed. Check password.');
        }
    }
    /**
     * Convert DOCX to PDF using LibreOffice
     */
    async convertDocxToPdf(inputPath, outputPatternDir) {
        const command = `"${loCommand}" --headless --convert-to pdf "${inputPath}" --outdir "${outputPatternDir}"`;
        try {
            await execPromise(command, { timeout: 30000 });
            const parsed = path.parse(inputPath);
            return path.join(outputPatternDir, `${parsed.name}.pdf`);
        } catch (error) {
            console.error('LibreOffice DOCX to PDF failed:', error);
            throw new Error('DOCX to PDF Conversion failed');
        }
    }

    /**
     * Convert PDF to DOCX using LibreOffice (Experimental PDF Import)
     */
    async convertPdfToDocx(inputPath, outputPatternDir) {
        const command = `"${loCommand}" --headless --infilter="writer_pdf_import" --convert-to docx "${inputPath}" --outdir "${outputPatternDir}"`;
        try {
            await execPromise(command, { timeout: 30000 });
            const parsed = path.parse(inputPath);
            return path.join(outputPatternDir, `${parsed.name}.docx`);
        } catch (error) {
            console.error('LibreOffice PDF to DOCX failed:', error);
            throw new Error('PDF to DOCX Conversion failed');
        }
    }
}

// --- Global Concurrency Limiter (Max 3 Heavy Jobs) ---
class Semaphore {
    constructor(maxCount) {
        this.maxCount = maxCount;
        this.activeCount = 0;
        this.waiters = [];
    }

    async acquire() {
        if (this.activeCount < this.maxCount) {
            this.activeCount++;
            return true;
        }
        return new Promise(resolve => {
            this.waiters.push(resolve);
        });
    }

    release() {
        if (this.waiters.length > 0) {
            const resolve = this.waiters.shift();
            resolve(true);
        } else {
            this.activeCount--;
        }
    }
}

const globalLimit = new Semaphore(3);

async function runWithLimit(task) {
    await globalLimit.acquire();
    try {
        return await task();
    } finally {
        globalLimit.release();
    }
}

const workerInstance = new PDFWorker();

// Wrap all methods with the concurrency limit
for (const key of Object.getOwnPropertyNames(PDFWorker.prototype)) {
    if (key !== 'constructor' && typeof workerInstance[key] === 'function') {
        const originalMethod = workerInstance[key].bind(workerInstance);
        workerInstance[key] = (...args) => runWithLimit(() => originalMethod(...args));
    }
}

module.exports = workerInstance;
