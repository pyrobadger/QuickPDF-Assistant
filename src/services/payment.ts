import Razorpay from 'razorpay';
import crypto from 'crypto';

let instance: any = null;

function getRazorpay() {
  if (!instance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Missing Razorpay Environment Variables!");
    }
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }
  return instance;
}

export async function createOrder(phone: string, isYearly: boolean) {
  try {
    const rzp = getRazorpay();
    const amount = isYearly ? 89900 : 9900; // 899 INR or 99 INR in paise
    
    const options = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_${phone.substring(0, 10)}_${Date.now()}`,
      notes: {
        phone: phone,
        isYearly: isYearly ? "true" : "false"
      }
    };
    
    const order = await rzp.orders.create(options);
    return order;
  } catch (error) {
    console.error("Failed to create Razorpay order", error);
    throw error;
  }
}

// We leave cancelSubscription here just in case any old monthly subscribers want to cancel from WhatsApp
export async function cancelSubscription(subscriptionId: string) {
  try {
    const rzp = getRazorpay();
    const response = await rzp.subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: true // Allows them to finish their current paid month
    });
    return response;
  } catch (error) {
    console.error("Failed to cancel Razorpay subscription", error);
    throw error;
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
    
  return generatedSignature === signature;
}

export function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(orderId + "|" + paymentId) // Standard format for Razorpay Orders
    .digest('hex');
    
  return generatedSignature === signature;
}
