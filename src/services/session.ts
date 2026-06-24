import NodeCache from 'node-cache';

// Cache keys expire after 15 minutes (900 seconds) of inactivity
const sessionCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });
// Daily limits cache removed - migrated to database
// Long-lived cache for tracking seen users (30 days = 2592000 seconds)
const seenUserCache = new NodeCache({ stdTTL: 2592000, checkperiod: 86400 });

export interface AppSession {
    action: string | null;
    stage: string | null;
    files: string[];
    metadata: any;
}

class SessionService {

    getSession(phoneNumber: string): AppSession {
        let session = sessionCache.get<AppSession>(phoneNumber);
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

    updateSession(phoneNumber: string, data: AppSession) {
        sessionCache.set(phoneNumber, data);
    }

    clearSession(phoneNumber: string) {
        sessionCache.del(phoneNumber);
    }



    isFirstTimeUser(phoneNumber: string): boolean {
        const hasSeen = seenUserCache.get<boolean>(phoneNumber);
        if (!hasSeen) {
            seenUserCache.set(phoneNumber, true);
            return true;
        }
        return false;
    }
}

export default new SessionService();
