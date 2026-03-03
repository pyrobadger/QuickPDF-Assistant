const NodeCache = require('node-cache');
// Cache keys expire after 15 minutes (900 seconds) of inactivity
const sessionCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });
// Daily limits cache (24 hours)
const dailyLimitCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

class SessionService {

    getSession(phoneNumber) {
        let session = sessionCache.get(phoneNumber);
        if (!session) {
            session = {
                action: null,
                stage: null,
                files: [], // To store paths for multi-file operations like merge
                metadata: {} // Any additional state info needed
            };
            this.updateSession(phoneNumber, session);
        }
        return session;
    }

    updateSession(phoneNumber, data) {
        sessionCache.set(phoneNumber, data);
    }

    clearSession(phoneNumber) {
        sessionCache.del(phoneNumber);
    }

    incrementDailyUsage(phoneNumber) {
        let usage = dailyLimitCache.get(phoneNumber) || 0;
        usage += 1;
        dailyLimitCache.set(phoneNumber, usage);
        return usage;
    }

    getDailyUsage(phoneNumber) {
        return dailyLimitCache.get(phoneNumber) || 0;
    }
}

module.exports = new SessionService();
