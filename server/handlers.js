const { isValidKey, isValidText, isValidMouseMove } = require('./validation');

function describeError(err) {
    return err instanceof Error ? err.message : String(err);
}

function safeHandler(name, fn) {
    return (...args) => {
        try {
            Promise.resolve(fn(...args)).catch((err) => {
                console.error(`[bridge] handler ${name} gagal: ${describeError(err)}`);
            });
        } catch (err) {
            console.error(`[bridge] handler ${name} gagal: ${describeError(err)}`);
        }
    };
}

function hasDataArgs(args) {
    return args.some((arg) => typeof arg !== 'function');
}

function registerSocketHandlers(socket, handlers) {
    socket.on('send-key', safeHandler('send-key', (key) => {
        if (!isValidKey(key)) {
            console.warn('[bridge] payload send-key ditolak');
            return;
        }
        return handlers.sendKey(key);
    }));

    socket.on('send-text', safeHandler('send-text', (text) => {
        if (!isValidText(text)) {
            console.warn('[bridge] payload send-text ditolak');
            return;
        }
        return handlers.sendText(text);
    }));

    socket.on('mouse-move', safeHandler('mouse-move', (data) => {
        if (!isValidMouseMove(data)) {
            console.warn('[bridge] payload mouse-move ditolak');
            return;
        }
        return handlers.sendMouseMove(data.dx, data.dy);
    }));

    socket.on('mouse-click', safeHandler('mouse-click', (...args) => {
        if (hasDataArgs(args)) {
            console.warn('[bridge] payload mouse-click ditolak');
            return;
        }
        return handlers.sendMouseClick();
    }));

    socket.on('force-scan', safeHandler('force-scan', (...args) => {
        if (hasDataArgs(args)) {
            console.warn('[bridge] payload force-scan ditolak');
            return;
        }
        return handlers.forceScan();
    }));
}

module.exports = { registerSocketHandlers, safeHandler };
