const fs = require('fs');
const path = require('path');

class CleanupService {
    startCleanupJob(intervalMinutes = 15) {
        console.log(`Starting cleanup job, runs every ${intervalMinutes} minutes.`);
        setInterval(() => {
            this.cleanTmpDirectory();
        }, intervalMinutes * 60 * 1000);

        // Run once on startup
        this.cleanTmpDirectory();
    }

    cleanTmpDirectory() {
        const tmpDir = path.join(__dirname, '..', 'tmp');
        // Max age of a file in tmp before it gets deleted (15 mins)
        const MAX_AGE_MS = 15 * 60 * 1000;

        fs.readdir(tmpDir, (err, files) => {
            if (err) {
                if (err.code !== 'ENOENT') {
                    console.error('Error reading tmp directory for cleanup:', err);
                }
                return;
            }

            const now = Date.now();
            files.forEach(file => {
                const filePath = path.join(tmpDir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) return;
                    const diff = now - new Date(stats.mtime).getTime();
                    if (diff > MAX_AGE_MS) {
                        fs.rm(filePath, { recursive: true, force: true }, err => {
                            if (err && err.code !== 'ENOENT') {
                                console.error(`Failed to delete old item ${file}:`, err);
                            } else if (!err) {
                                console.log(`Cleaned up old item: ${file}`);
                            }
                        });
                    }
                });
            });
        });
    }
}

module.exports = new CleanupService();
