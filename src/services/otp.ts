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
    async sendOtp(phone: string): Promise<void> {
        // Generate 6-digit numeric OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store in cache
        otpCache.set(phone, code);
        
        console.log(`[OTP Service] Generated OTP ${code} for phone: ${phone}`);
        
        const message = `🔐 Your QuickPDF Pro verification code is: *${code}*\n\nThis code is valid for 5 minutes. Do not share this code with anyone.`;
        
        // Send via WhatsApp
        await whatsappService.sendTextMessage(phone, message);
    }

    /**
     * Verify the entered code against the cached OTP
     */
    verifyOtp(phone: string, inputCode: string): boolean {
        const cachedCode = otpCache.get<string>(phone);
        
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
    isVerified(phone: string): boolean {
        return !!verifiedCache.get<boolean>(phone);
    }

    /**
     * Clear verified status (optional helper)
     */
    clearVerified(phone: string): void {
        verifiedCache.del(phone);
    }
}

export default new OtpService();
