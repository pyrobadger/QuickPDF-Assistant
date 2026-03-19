const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedDb = client.db('quickpdf');
  return cachedDb;
}

/**
 * Log a user interaction to MongoDB
 * @param {string} phone - User's phone number
 * @param {string} action - Action performed (e.g. merge, split)
 * @param {object} metadata - Any relevant extra info like file size, duration, etc.
 */
async function logInteraction(phone, action, metadata = {}) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('interactions');
    await collection.insertOne({
      phone,
      action,
      ...metadata,
      timestamp: new Date()
    });
    // Also save/update the user in a users collection to keep track of everyone
    const usersCollection = db.collection('users');
    await usersCollection.updateOne(
      { phone },
      { 
        $set: { 
          phone, 
          lastActive: new Date() 
        },
        $setOnInsert: {
          onboardedAt: new Date()
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Failed to log interaction to MongoDB:', error);
  }
}

/**
 * Save user to waitlist
 * @param {string} phone 
 */
async function saveToWaitlist(phone) {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('waitlist');
        const existing = await collection.findOne({ phone });
        if (!existing) {
            await collection.insertOne({
                phone,
                dateSubmitted: new Date().toISOString()
            });
            return true;
        }
        return false;
    } catch (err) {
        console.error('Failed to save to waitlist DB:', err);
        throw err;
    }
}

module.exports = {
  connectToDatabase,
  logInteraction,
  saveToWaitlist
};
