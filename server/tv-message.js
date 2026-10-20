const { parseTvMessage, extractToken } = require('./validation');

function createTvMessageHandler({ getSavedToken, saveToken, emitStatus, log = console }) {
    return (raw) => {
        try {
            const msg = parseTvMessage(raw);
            if (!msg) {
                log.warn('Frame TV tidak valid diabaikan.');
                return;
            }

            if (msg.event === 'ms.channel.unauthorized') {
                log.warn('TV menolak pairing (unauthorized).');
                emitStatus('Gagal: TV menolak pairing');
                return;
            }

            const newToken = extractToken(msg);
            if (!newToken) return;

            let savedToken = '';
            try {
                savedToken = getSavedToken() || '';
            } catch (err) {
                log.error('Gagal membaca token:', err.message);
            }

            if (newToken !== savedToken) {
                const saved = saveToken(newToken);
                if (saved !== false) log.log('>>> Token pairing baru disimpan.');
            }
        } catch (err) {
            log.error('Gagal memproses frame TV:', err.message);
        }
    };
}

module.exports = { createTvMessageHandler };
