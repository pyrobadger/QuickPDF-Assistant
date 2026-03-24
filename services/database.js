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
        { phone, lastActive: new Date().toISOString() },
        { onConflict: 'phone' }
      );

    // Log the interaction
    const { error } = await supabase
      .from('interactions')
      .insert({
        phone,
        action,
        timestamp: new Date().toISOString(),
        ...metadata
      });

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
      .insert({ phone, dateSubmitted: new Date().toISOString() });

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