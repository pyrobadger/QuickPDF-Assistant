import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
       console.error("Missing Supabase Environment Variables!");
    }
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  return supabase;
}

/**
 * Log a user interaction to Supabase
 * @param {string} phone - User's phone number
 * @param {string} action - Action performed (e.g. merge, split)
 * @param {object} metadata - Any relevant extra info like file size, duration, etc.
 */
export async function logInteraction(phone: string, action: string, metadata: any = {}) {
  try {
    const client = getSupabase();
    // Ensure user exists
    await client
      .from('users')
      .upsert(
        { phone, lastactive: new Date().toISOString() },
        { onConflict: 'phone' }
      );

    // Prepare interaction record
    const record: any = {
      phone,
      action,
      timestamp: new Date().toISOString(),
    };

    // Map the camelCase JS metadata to the all-lowercase Postgres columns
    // and put unrecognized things into 'metadata' jsonb column
    const schemaColumns = ['pagecount', 'filesizemb', 'mimetype', 'status'];
    const jsonbData: any = {};

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (schemaColumns.includes(lowerKey)) {
        record[lowerKey] = value;
      } else {
        jsonbData[key] = value; // put into JSONB field
      }
    }

    if (Object.keys(jsonbData).length > 0) {
      record.metadata = jsonbData;
    }

    // Log the interaction
    const { error } = await client
      .from('interactions')
      .insert(record);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to log interaction to Supabase:', error);
  }
}

/**
 * Save user to waitlist
 * @param {string} phone 
 */
export async function saveToWaitlist(phone: string) {
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
  } catch (err) {
    console.error('Failed to save to waitlist:', err);
    throw err;
  }
}
