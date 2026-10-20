const fs = require('fs');

function createTokenStore(filePath, fsImpl = fs, log = console) {
    return {
        get() {
            try {
                if (!fsImpl.existsSync(filePath)) return '';
                return fsImpl.readFileSync(filePath, 'utf8').trim();
            } catch (err) {
                log.error('Gagal membaca token:', err.message);
                return '';
            }
        },
        save(token) {
            try {
                fsImpl.writeFileSync(filePath, token);
                return true;
            } catch (err) {
                log.error('Gagal menyimpan token:', err.message);
                return false;
            }
        }
    };
}

module.exports = { createTokenStore };
