import NodeCache from 'node-cache';
import whatsappService from './whatsapp.js';
// OTP cache: valid for 5 minutes (300 seconds)
const otpCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
// Verified status cache: valid for 30 minutes (1800 seconds)
const verifiedCache = new NodeCache({ stdTTL: 1800, checkperiod: 120 });
class OtpService {
    /**
     * Generate a 6-digit OTP, store it in cache, and send it via WhatsApp Cloud API
     */
    async sendOtp(phone) {
        // Generate 6-digit numeric OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Store in cache
        otpCache.set(phone, code);
        console.log(`[OTP Service] Generated OTP ${code} for phone: ${phone}`);
        // 1. Try sending via Approved Meta Template 'quickpdf_otp'
        const templateSent = await whatsappService.sendTemplateMessage(phone, 'quickpdf_otp', 'en', [code], [code]);
        // 2. If template failed (e.g. still in review or not found), fallback to standard text message
        if (!templateSent) {
            console.log(`[OTP Service] Template 'quickpdf_otp' failed or pending approval. Falling back to standard text message...`);
            const message = `🔐 Your QuickPDF Pro verification code is: *${code}*\n\nThis code is valid for 5 minutes. Do not share this code with anyone.`;
            await whatsappService.sendTextMessage(phone, message);
        }
    }
    /**
     * Verify the entered code against the cached OTP
     */
    verifyOtp(phone, inputCode) {
        const cachedCode = otpCache.get(phone);
        if (!cachedCode) {
            console.log(`[OTP Service] Verification failed for ${phone}: OTP expired or not found.`);
            return false;
        }
        if (cachedCode === inputCode.trim()) {
            // Delete OTP after successful verification
            otpCache.del(phone);
            // Mark phone as verified for 30 minutes
            verifiedCache.set(phone, true);
            console.log(`[OTP Service] Successfully verified phone: ${phone}`);
            return true;
        }
        console.log(`[OTP Service] Verification failed for ${phone}: Incorrect code.`);
        return false;
    }
    /**
     * Check if a phone number has been verified within the last 30 minutes
     */
    isVerified(phone) {
        return !!verifiedCache.get(phone);
    }
    /**
     * Clear verified status (optional helper)
     */
    clearVerified(phone) {
        verifiedCache.del(phone);
    }
}
export default new OtpService();
