const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Log a user interaction to Supabase
 * @param {string} phone - User's phone number
 * @param {string} action - Action performed (e.g. merge, split)
 * @param {object} metadata - Any relevant extra info like file size, duration, etc.
 */
async function logInteraction(phone, action, metadata = {}) {
  try {
    // Ensure user exists
    await supabase
      .from('users')
      .upsert(
        { phone, lastactive: new Date().toISOString() },
        { onConflict: 'phone' }
      );

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
      } else {
        jsonbData[key] = value; // put into JSONB field
      }
    }

    if (Object.keys(jsonbData).length > 0) {
      record.metadata = jsonbData;
    }

    // Log the interaction
    const { error } = await supabase
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
async function saveToWaitlist(phone) {
  try {
    const { data, error } = await supabase
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

module.exports = {
  logInteraction,
  saveToWaitlist
};