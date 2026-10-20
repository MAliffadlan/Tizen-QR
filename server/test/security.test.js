const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

const {
  isValidKey,
  isValidText,
  isValidMouseMove,
  isValidMac,
  parseTvMessage,
  extractToken,
} = require('../validation');
const { registerSocketHandlers } = require('../handlers');
const { createTokenStore } = require('../token-store');
const { createTvMessageHandler } = require('../tv-message');

const originalWarn = console.warn;

before(() => {
  console.warn = () => {};
});

after(() => {
  console.warn = originalWarn;
});

function createHarness(overrides = {}) {
  const socket = new EventEmitter();
  const calls = { keys: [], texts: [], moves: [], clicks: 0, scans: 0 };

  registerSocketHandlers(socket, {
    sendKey: (key) => calls.keys.push(key),
    sendText: (text) => calls.texts.push(text),
    sendMouseMove: (dx, dy) => calls.moves.push([dx, dy]),
    sendMouseClick: () => { calls.clicks += 1; },
    forceScan: async () => { calls.scans += 1; },
    ...overrides,
  });

  return { socket, calls };
}

test('menerima key Samsung yang valid', () => {
  for (const key of ['KEY_POWER', 'KEY_HOME', 'KEY_TTX_MIX', 'KEY_0']) {
    assert.equal(isValidKey(key), true);
  }
});

test('menolak key yang bukan string KEY_* yang valid', () => {
  for (const key of [null, undefined, 42, {}, '', 'POWER', 'KEY_power', 'KEY_X; rm -rf /', `KEY_${'A'.repeat(70)}`]) {
    assert.equal(isValidKey(key), false);
  }
});

test('menerima teks non-kosong dalam batas panjang', () => {
  assert.equal(isValidText('halo'), true);
  assert.equal(isValidText('x'.repeat(2048)), true);
});

test('menolak teks null, bukan string, kosong, atau terlalu panjang', () => {
  for (const text of [null, undefined, 42, {}, '', 'x'.repeat(2049)]) {
    assert.equal(isValidText(text), false);
  }
});

test('menerima gerakan mouse dengan angka finite dalam batas', () => {
  assert.equal(isValidMouseMove({ dx: 12, dy: -8 }), true);
  assert.equal(isValidMouseMove({ dx: 10000, dy: -10000 }), true);
});

test('menolak gerakan mouse yang tidak valid', () => {
  for (const data of [
    null,
    undefined,
    {},
    { dx: NaN, dy: 1 },
    { dx: Infinity, dy: 0 },
    { dx: '1', dy: 2 },
    { dx: 10001, dy: 0 },
  ]) {
    assert.equal(isValidMouseMove(data), false);
  }
});

test('memvalidasi MAC address untuk Wake-on-LAN', () => {
  assert.equal(isValidMac('64:1C:AE:FD:C1:B6'), true);
  assert.equal(isValidMac('64-1C-AE-FD-C1-B6'), true);

  for (const mac of [null, '', 'not-a-mac', '64:1C-AE-FD:C1-B6', '64:1C:AE:FD:C1', '64:1C:AE:FD:C1:BG', {}]) {
    assert.equal(isValidMac(mac), false);
  }
});

test('mem-parse frame TV JSON yang valid', () => {
  const msg = parseTvMessage(Buffer.from('{"event":"ms.channel.connect","data":{"token":"abc"}}'));
  assert.deepEqual(msg, { event: 'ms.channel.connect', data: { token: 'abc' } });
});

test('mengembalikan null untuk frame TV yang tidak valid', () => {
  for (const raw of ['bukan json', 'null', '[]', '{}', '{"event":123}', Buffer.from([0xff, 0xfe])]) {
    assert.equal(parseTvMessage(raw), null);
  }
});

test('mengekstrak token hanya dari event ms.channel.connect yang valid', () => {
  assert.equal(extractToken({ event: 'ms.channel.connect', data: { token: 'abc' } }), 'abc');
  assert.equal(extractToken({ event: 'ms.channel.connect', data: null }), null);
  assert.equal(extractToken({ event: 'ms.channel.connect', data: { token: 42 } }), null);
  assert.equal(extractToken({ event: 'lain', data: { token: 'abc' } }), null);
  assert.equal(extractToken(null), null);
});

test('tidak meneruskan payload Socket.IO yang tidak valid', () => {
  const { socket, calls } = createHarness();

  assert.doesNotThrow(() => socket.emit('send-text', null));
  assert.doesNotThrow(() => socket.emit('send-text', 42));
  assert.doesNotThrow(() => socket.emit('send-key', {}));
  assert.doesNotThrow(() => socket.emit('send-key', 'BUKAN_KEY'));
  assert.doesNotThrow(() => socket.emit('mouse-move'));
  assert.doesNotThrow(() => socket.emit('mouse-move', { dx: NaN, dy: 1 }));

  assert.deepEqual(calls.texts, []);
  assert.deepEqual(calls.keys, []);
  assert.deepEqual(calls.moves, []);
});

test('meneruskan payload Socket.IO yang valid', () => {
  const { socket, calls } = createHarness();

  socket.emit('send-text', 'halo');
  socket.emit('send-key', 'KEY_HOME');
  socket.emit('mouse-move', { dx: 12, dy: -8 });
  socket.emit('mouse-click');

  assert.deepEqual(calls.texts, ['halo']);
  assert.deepEqual(calls.keys, ['KEY_HOME']);
  assert.deepEqual(calls.moves, [[12, -8]]);
  assert.equal(calls.clicks, 1);
});

test('menangkap exception sinkron dari handler', () => {
  const { socket } = createHarness({
    sendKey: () => { throw new Error('boom'); },
  });

  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));

  try {
    assert.doesNotThrow(() => socket.emit('send-key', 'KEY_HOME'));
  } finally {
    console.error = originalError;
  }

  assert.equal(errors.length, 1);
});

test('menangkap rejection dari handler async', async () => {
  const { socket } = createHarness({
    forceScan: async () => { throw new Error('async boom'); },
  });

  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));

  try {
    socket.emit('force-scan');
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    console.error = originalError;
  }

  assert.equal(errors.length, 1);
});

test('menangkap rejection dari dependency handler async', async () => {
  const { socket } = createHarness({
    sendKey: async () => { throw new Error('async dep boom'); },
  });

  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));

  try {
    assert.doesNotThrow(() => socket.emit('send-key', 'KEY_HOME'));
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    console.error = originalError;
  }

  assert.equal(errors.length, 1);
});

test('menolak payload untuk event tanpa parameter', async () => {
  const { socket, calls } = createHarness();

  assert.doesNotThrow(() => socket.emit('mouse-click', 'junk'));
  assert.doesNotThrow(() => socket.emit('force-scan', { junk: true }));
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(calls.clicks, 0);
  assert.equal(calls.scans, 0);
});

test('meneruskan force-scan tanpa payload', async () => {
  const { socket, calls } = createHarness();

  socket.emit('force-scan');
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(calls.scans, 1);
});

test('token store membaca dan menyimpan token', () => {
  let stored = '';
  const store = createTokenStore('token.txt', {
    existsSync: () => stored !== '',
    readFileSync: () => stored,
    writeFileSync: (_path, value) => { stored = value; },
  });

  assert.equal(store.get(), '');
  assert.equal(store.save('abc'), true);
  assert.equal(store.get(), 'abc');
});

test('token store tidak melempar saat gagal membaca', () => {
  const store = createTokenStore('token.txt', {
    existsSync: () => true,
    readFileSync: () => { throw new Error('EACCES'); },
    writeFileSync: () => {},
  }, { error: () => {} });

  assert.doesNotThrow(() => store.get());
  assert.equal(store.get(), '');
});

test('token store tidak melempar saat gagal menyimpan', () => {
  const store = createTokenStore('token.txt', {
    existsSync: () => false,
    readFileSync: () => '',
    writeFileSync: () => { throw new Error('EROFS'); },
  }, { error: () => {} });

  assert.doesNotThrow(() => store.save('abc'));
  assert.equal(store.save('abc'), false);
});

function createMessageHarness(overrides = {}) {
  const calls = { saved: [], statuses: [], logs: [] };
  const handler = createTvMessageHandler({
    getSavedToken: () => '',
    saveToken: (token) => calls.saved.push(token),
    emitStatus: (status) => calls.statuses.push(status),
    log: {
      warn: (msg) => calls.logs.push(msg),
      error: (msg) => calls.logs.push(msg),
      log: (msg) => calls.logs.push(msg),
    },
    ...overrides,
  });
  return { handler, calls };
}

test('mengabaikan frame TV yang tidak valid tanpa menyimpan token', () => {
  const { handler, calls } = createMessageHarness();

  assert.doesNotThrow(() => handler(Buffer.from('not json')));
  assert.deepEqual(calls.saved, []);
  assert.deepEqual(calls.statuses, []);
});

test('menangani event unauthorized tanpa menyimpan token', () => {
  const { handler, calls } = createMessageHarness();

  assert.doesNotThrow(() => handler(Buffer.from(JSON.stringify({ event: 'ms.channel.unauthorized' }))));
  assert.deepEqual(calls.statuses, ['Gagal: TV menolak pairing']);
  assert.deepEqual(calls.saved, []);
});

test('menyimpan token dari event ms.channel.connect', () => {
  const { handler, calls } = createMessageHarness();

  handler(Buffer.from(JSON.stringify({ event: 'ms.channel.connect', data: { token: 'abc' } })));
  assert.deepEqual(calls.saved, ['abc']);
});

test('tidak menulis ulang token yang sama', () => {
  const { handler, calls } = createMessageHarness({ getSavedToken: () => 'abc' });

  handler(Buffer.from(JSON.stringify({ event: 'ms.channel.connect', data: { token: 'abc' } })));
  assert.deepEqual(calls.saved, []);
});

test('kegagalan menyimpan token tidak mematikan handler', () => {
  const { handler } = createMessageHarness({
    saveToken: () => { throw new Error('disk penuh'); },
  });

  assert.doesNotThrow(() => handler(Buffer.from(JSON.stringify({ event: 'ms.channel.connect', data: { token: 'abc' } }))));
});

test('kegagalan membaca token tidak menghalangi penyimpanan token baru', () => {
  const { handler, calls } = createMessageHarness({
    getSavedToken: () => { throw new Error('EACCES'); },
  });

  assert.doesNotThrow(() => handler(Buffer.from(JSON.stringify({ event: 'ms.channel.connect', data: { token: 'abc' } }))));
  assert.deepEqual(calls.saved, ['abc']);
});
