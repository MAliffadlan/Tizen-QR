const KEY_PATTERN = /^KEY_[A-Z0-9_]{1,64}$/;
const MAX_TEXT_LENGTH = 2048;
const MAX_MOUSE_DELTA = 10000;

function isValidKey(key) {
    return typeof key === 'string' && KEY_PATTERN.test(key);
}

function isValidText(text) {
    return typeof text === 'string' && text.length > 0 && text.length <= MAX_TEXT_LENGTH;
}

function isValidMouseMove(data) {
    return data !== null
        && typeof data === 'object'
        && Number.isFinite(data.dx)
        && Number.isFinite(data.dy)
        && Math.abs(data.dx) <= MAX_MOUSE_DELTA
        && Math.abs(data.dy) <= MAX_MOUSE_DELTA;
}

function isValidMac(mac) {
    return typeof mac === 'string' && /^([0-9A-Fa-f]{2})([:-])(?:[0-9A-Fa-f]{2}\2){4}[0-9A-Fa-f]{2}$/.test(mac);
}

function parseTvMessage(raw) {
    try {
        const msg = JSON.parse(raw.toString());
        if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return null;
        if (typeof msg.event !== 'string') return null;
        return msg;
    } catch {
        return null;
    }
}

function extractToken(msg) {
    if (!msg || msg.event !== 'ms.channel.connect') return null;
    if (!msg.data || typeof msg.data !== 'object') return null;
    return typeof msg.data.token === 'string' ? msg.data.token : null;
}

module.exports = {
    isValidKey,
    isValidText,
    isValidMouseMove,
    isValidMac,
    parseTvMessage,
    extractToken
};
