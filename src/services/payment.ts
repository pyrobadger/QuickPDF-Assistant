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

let cachedPlanId: string | null = null;

async function getPlanId(rzp: any) {
  if (cachedPlanId) return cachedPlanId;
  
  try {
    const plans = await rzp.plans.all();
    const existing = plans.items.find((p: any) => p.item.name === "QuickPDF Pro Monthly");
    if (existing) {
        cachedPlanId = existing.id;
        return cachedPlanId;
    }
    
    const plan = await rzp.plans.create({
        period: "monthly",
        interval: 1,
        item: {
            name: "QuickPDF Pro Monthly",
            amount: 9900,
            currency: "INR",
            description: "Unlimited PDF operations on WhatsApp"
        }
    });
    cachedPlanId = plan.id;
    return cachedPlanId;
  } catch (err) {
    console.error("Error fetching/creating Razorpay plan:", err);
    throw err;
  }
}

export async function createSubscription(phone: string) {
  try {
    const rzp = getRazorpay();
    const planId = await getPlanId(rzp);
    
    const options = {
      plan_id: planId,
      total_count: 120, // 10 years
      customer_notify: 1,
      notes: {
        phone: phone // Crucial for webhook linking
      }
    };
    const subscription = await rzp.subscriptions.create(options);
    return subscription;
  } catch (error) {
    console.error("Failed to create Razorpay subscription", error);
    throw error;
  }
}

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
    .update(orderId + "|" + paymentId)
    .digest('hex');
    
  return generatedSignature === signature;
}
