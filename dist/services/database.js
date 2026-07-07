import { createClient, SupabaseClient } from '@supabase/supabase-js';
let supabase = null;
function getSupabase() {
    if (!supabase) {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.error("Missing Supabase Environment Variables!");
        }
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }
    return supabase;
}
/**
 * Log a user interaction to Supabase
 * @param {string} phone - User's phone number
 * @param {string} action - Action performed (e.g. merge, split)
 * @param {object} metadata - Any relevant extra info like file size, duration, etc.
 */
export async function logInteraction(phone, action, metadata = {}) {
    try {
        const client = getSupabase();
        // Ensure user exists
        const { error: userError } = await client
            .from('users')
            .upsert({ phone, lastactive: new Date().toISOString() }, { onConflict: 'phone' });
        if (userError) {
            console.error('Failed to upsert user:', userError);
            // We continue anyway to try and log the interaction
        }
        // Prepare interaction record
        const record = {
            phone,
            action,
            timestamp: new Date().toISOString(),
        };
        // Map the camelCase JS metadata to the all-lowercase Postgres columns
        // and put unrecognized things into 'metadata' jsonb column
        const schemaColumns = ['pagecount', 'filesizemb', 'mimetype', 'status'];
        const jsonbData = {};
        for (const [key, value] of Object.entries(metadata)) {
            const lowerKey = key.toLowerCase();
            if (schemaColumns.includes(lowerKey)) {
                record[lowerKey] = value;
            }
            else {
                jsonbData[key] = value; // put into JSONB field
            }
        }
        if (Object.keys(jsonbData).length > 0) {
            record.metadata = jsonbData;
        }
        // Log the interaction
        console.log(`Attempting to log interaction for ${phone}: ${action}`);
        const { error } = await client
            .from('interactions')
            .insert(record);
        if (error)
            throw error;
        console.log(`Successfully logged interaction for ${phone}`);
    }
    catch (error) {
        console.error('Failed to log interaction to Supabase:', error);
    }
}
/**
 * Save user to waitlist
 * @param {string} phone
 */
export async function saveToWaitlist(phone) {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('waitlist')
            .insert({ phone, datesubmitted: new Date().toISOString() });
        if (error) {
            if (error.code === '23505') {
                // Unique constraint violation - phone already exists
                return false;
            }
            throw error;
        }
        return true;
    }
    catch (err) {
        console.error('Failed to save to waitlist:', err);
        throw err;
    }
}
/**
 * Log document processing statistics to a dedicated table
 * @param {string} phone - User's phone number
 * @param {string} action - Action performed
 * @param {number} inputCount - Number of input documents
 * @param {number} outputCount - Number of output documents
 */
export async function logDocumentStats(phone, action, inputCount, outputCount) {
    try {
        const client = getSupabase();
        const record = {
            phone,
            action,
            input_count: inputCount,
            output_count: outputCount,
            timestamp: new Date().toISOString()
        };
        const { error } = await client
            .from('document_stats')
            .insert(record);
        if (error)
            throw error;
    }
    catch (error) {
        console.error('Failed to log document stats to Supabase:', error);
    }
}
/**
 * Get daily usage count for a user based on successful interactions today
 * @param {string} phone
 */
export async function getDailyUsage(phone) {
    try {
        const client = getSupabase();
        // Get start of today in UTC
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const { count, error } = await client
            .from('interactions')
            .select('*', { count: 'exact', head: true })
            .eq('phone', phone)
            .eq('status', 'success')
            .gte('timestamp', startOfDay.toISOString());
        if (error)
            throw error;
        return count || 0;
    }
    catch (error) {
        console.error('Failed to get daily usage:', error);
        return 0; // Fallback to 0 if db fails
    }
}
/**
 * Check if a user has an active Pro subscription
 * @param {string} phone
 */
export async function isUserPro(phone) {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('subscriptions')
            .select('status, current_period_end')
            .eq('phone', phone)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return false; // No rows found
            throw error;
        }
        if (data && data.status === 'active') {
            // Check if period end is in the future
            if (new Date(data.current_period_end) > new Date()) {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        console.error('Failed to check user pro status:', error);
        return false;
    }
}
/**
 * Upsert a subscription record
 */
export async function updateSubscription(phone, subscriptionId, status, planId, currentPeriodEnd) {
    try {
        const client = getSupabase();
        const { error } = await client
            .from('subscriptions')
            .upsert({
            phone: phone,
            subscription_id: subscriptionId,
            status: status,
            plan_id: planId,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString()
        }, { onConflict: 'phone' });
        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }
    }
    catch (error) {
        console.error('Failed to update subscription:', error);
        throw error;
    }
}
/**
 * Get active subscription ID for a user
 */
export async function getSubscriptionId(phone) {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('subscriptions')
            .select('subscription_id')
            .eq('phone', phone)
            .eq('status', 'active')
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw error;
        }
        return data?.subscription_id || null;
    }
    catch (error) {
        console.error('Failed to get subscription id:', error);
        return null;
    }
}
