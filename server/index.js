const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const qrcode = require('qrcode');
const { internalIpV4 } = require('internal-ip');
const fs = require('fs');
const path = require('path');
const wol = require('wake_on_lan');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 3001;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8774634788:AAHccKIZWnGOCvZYAq8T4SA5VZMDntZnFac';
const ALLOWED_USER_ID = '5868902139';
const TOKEN_FILE = path.join(__dirname, 'tv-token.txt');
const CONFIG_FILE = path.join(__dirname, 'tv-config.json');
const REMOTE_NAME = 'Alif_Remote_Super';
const FIXED_ID = 'alif_super_id_001';

// TV Configuration State
let tvConfig = {
    ip: null,
    mac: null,
    name: 'Samsung TV'
};

let tvWs = null;
let currentPort = 8002;

// --- Config Management ---
function loadTvConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            tvConfig = JSON.parse(data);
            console.log(`Loaded TV Config: ${tvConfig.name} (${tvConfig.ip})`);
            return true;
        } catch (e) {
            console.error('Failed to parse tv-config.json', e);
        }
    }
    return false;
}

function saveTvConfig(config) {
    tvConfig = { ...tvConfig, ...config };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(tvConfig, null, 2));
    console.log(`TV Config saved: ${tvConfig.name} (${tvConfig.ip})`);
}

function getSavedToken() {
    if (fs.existsSync(TOKEN_FILE)) return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    return '';
}

// --- Auto Discovery & ARP Resolution ---
let isScanning = false;

function getIpFromArp(macAddress) {
    if (!macAddress) return null;
    const targetMac = macAddress.toLowerCase().trim();
    try {
        if (!fs.existsSync('/proc/net/arp')) return null;
        const arpData = fs.readFileSync('/proc/net/arp', 'utf8');
        const lines = arpData.split('\n');
        for (const line of lines) {
            const parts = line.split(/\s+/).filter(Boolean);
            if (parts.length >= 4) {
                const ip = parts[0];
                const mac = parts[3].toLowerCase().trim();
                if (mac === targetMac) {
                    return ip;
                }
            }
        }
    } catch (e) {
        console.error('[ARP] Gagal membaca ARP table:', e);
    }
    return null;
}

async function triggerAutoScan() {
    if (isScanning) return;
    isScanning = true;
    const found = await scanForTv();
    isScanning = false;
    if (found) {
        connectToTv(8002);
    }
}

async function scanForTv() {
    console.log('\n🔍 Memulai pelacakan TV Samsung di jaringan...');
    io.emit('tv-status', 'Sedang melacak TV di jaringan...');
    
    const ip = await internalIpV4();
    if (!ip) {
        console.log('Tidak dapat mendeteksi IP lokal.');
        return null;
    }
    
    const baseIp = ip.split('.').slice(0, 3).join('.');
    const promises = [];
    
    for (let i = 1; i < 255; i++) {
        const targetIp = `${baseIp}.${i}`;
        const p = new Promise(resolve => {
            const req = http.get(`http://${targetIp}:8001/api/v2/`, { timeout: 2000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const info = JSON.parse(data);
                        if (info && info.device && info.device.type === 'Samsung SmartTV') {
                            resolve({ 
                                ip: targetIp, 
                                mac: info.device.wifiMac || info.device.mac,
                                name: info.device.name 
                            });
                        } else {
                            resolve(null);
                        }
                    } catch(e) { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
        });
        promises.push(p);
    }
    
    const results = await Promise.all(promises);
    const tvs = results.filter(r => r !== null);
    
    if (tvs.length > 0) {
        const foundTv = tvs[0];
        console.log(`✅ TV Ditemukan: ${foundTv.name} di ${foundTv.ip} (MAC: ${foundTv.mac})`);
        saveTvConfig(foundTv);
        return foundTv;
    } else {
        console.log('❌ Tidak ada TV Samsung yang ditemukan.');
        io.emit('tv-status', 'TV offline atau tidak ditemukan');
        return null;
    }
}

// --- TV Connection ---
function connectToTv(port = 8002) {
    if (!tvConfig.ip) {
        console.log('IP TV belum diset.');
        return;
    }

    if (tvWs && tvWs.readyState === WebSocket.OPEN) return;

    currentPort = port;
    const token = getSavedToken();
    const encodedName = Buffer.from(REMOTE_NAME).toString('base64');
    
    const protocol = port === 8002 ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${tvConfig.ip}:${port}/api/v2/channels/samsung.remote.control?name=${encodedName}${token ? `&token=${token}` : ''}&id=${FIXED_ID}`;

    console.log(`\n--- MENCOBA KONEKSI KE TV (${tvConfig.ip}:${port}) ---`);
    io.emit('tv-status', `Menghubungkan ke ${tvConfig.name}...`);
    
    tvWs = new WebSocket(wsUrl, { 
        rejectUnauthorized: false,
        handshakeTimeout: 5000 
    });

    tvWs.on('open', () => {
        console.log(`Handshake WebSocket Terbuka di Port ${port}!`);
        io.emit('tv-status', `Terhubung ke ${tvConfig.name}`);
    });

    tvWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.event === 'ms.channel.connect') {
            const newToken = msg.data.token;
            if (newToken && newToken !== getSavedToken()) {
                console.log('>>> TOKEN PERMANEN DIDAPAT:', newToken);
                fs.writeFileSync(TOKEN_FILE, newToken);
            }
        }
    });

    tvWs.on('close', () => {
        console.log(`Koneksi ke ${tvConfig.ip}:${port} terputus.`);
        io.emit('tv-status', 'Koneksi terputus');
    });

    tvWs.on('error', (err) => {
        console.error(`Gagal konek ke ${tvConfig.ip}:${port}:`, err.message);
        if (port === 8002 && (err.message.includes('ECONNREFUSED') || err.message.includes('EHOSTUNREACH') || err.message.includes('ETIMEDOUT'))) {
            console.log('Mencoba fallback ke Port 8001...');
            setTimeout(() => connectToTv(8001), 2000);
        } else if (port === 8001) {
            console.log('Kedua port gagal. Memulai pencarian TV otomatis di jaringan...');
            triggerAutoScan();
        } else {
            io.emit('tv-status', 'Gagal terhubung ke TV');
        }
    });
}

function sendWakeOnLan(mac) {
    if (!mac) return;
    console.log(`--- MENGIRIM MAGIC PACKET (WAKE-ON-LAN) KE ${mac} ---`);
    wol.wake(mac, { address: '192.168.1.255', num_packets: 5, interval: 50 }, (err) => {
        if (!err) console.log(`Magic Packet terkirim ke 192.168.1.255 (${mac})`);
    });
    wol.wake(mac, { address: '255.255.255.255', num_packets: 5, interval: 50 }, (err) => {
        if (!err) console.log(`Magic Packet terkirim ke 255.255.255.255 (${mac})`);
    });
}

function sendKey(key) {
    if (key === 'KEY_POWER' && tvConfig.mac) {
        sendWakeOnLan(tvConfig.mac);
    }

    if (!tvWs || tvWs.readyState !== WebSocket.OPEN) {
        console.log('Koneksi belum siap, mencoba menyambung kembali...');
        
        // Cek dulu apakah IP berubah di ARP table
        if (tvConfig.mac) {
            const arpIp = getIpFromArp(tvConfig.mac);
            if (arpIp && arpIp !== tvConfig.ip) {
                console.log(`[ARP Auto-Scan] Mendeteksi IP TV berubah dari ${tvConfig.ip} ke ${arpIp}`);
                tvConfig.ip = arpIp;
                saveTvConfig(tvConfig);
            }
        }

        if (tvConfig.ip) {
            connectToTv(currentPort);
        } else {
            scanAndConnect();
        }
        
        setTimeout(() => {
            if (tvWs && tvWs.readyState === WebSocket.OPEN) {
                doSendKey(key);
            } else {
                console.log('TV masih belum siap, coba pencet lagi sebentar lagi bos.');
            }
        }, 3000); 
        return;
    }

    doSendKey(key);
}

function doSendKey(key) {
    const payload = {
        method: 'ms.remote.control',
        params: {
            Cmd: 'Click',
            DataOfCmd: key,
            Option: 'false',
            TypeOfRemote: 'SendRemoteKey'
        }
    };
    console.log(`Menembak: ${key}`);
    tvWs.send(JSON.stringify(payload));
}

function sendText(text) {
    if (!tvWs || tvWs.readyState !== WebSocket.OPEN) {
        console.log('Koneksi belum siap untuk kirim teks.');
        return;
    }

    console.log(`Mengetik ke TV: "${text}"`);

    const encodedText = Buffer.from(text).toString('base64');
    const payload = {
        method: 'ms.remote.control',
        params: {
            Cmd: encodedText,
            DataOfCmd: 'base64',
            TypeOfRemote: 'SendInputString'
        }
    };
    tvWs.send(JSON.stringify(payload));
}

function sendMouseMove(dx, dy) {
    if (!tvWs || tvWs.readyState !== WebSocket.OPEN) return;

    const payload = {
        method: 'ms.remote.control',
        params: {
            Cmd: 'Move',
            Position: {
                x: Math.round(dx),
                y: Math.round(dy),
                Time: String(Date.now())
            },
            TypeOfRemote: 'ProcessMouseDevice'
        }
    };
    tvWs.send(JSON.stringify(payload));
}

function sendMouseClick() {
    if (!tvWs || tvWs.readyState !== WebSocket.OPEN) return;

    const payload = {
        method: 'ms.remote.control',
        params: {
            Cmd: 'LeftClick',
            TypeOfRemote: 'ProcessMouseDevice'
        }
    };
    console.log('Mouse: LeftClick');
    tvWs.send(JSON.stringify(payload));
}

async function scanAndConnect() {
    const hasConfig = loadTvConfig();
    
    // Always start by trying to connect if we have a config
    if (hasConfig) {
        if (tvConfig.mac) {
            const arpIp = getIpFromArp(tvConfig.mac);
            if (arpIp && arpIp !== tvConfig.ip) {
                console.log(`[ARP Auto-Scan] Mendeteksi IP TV berubah dari ${tvConfig.ip} ke ${arpIp}`);
                tvConfig.ip = arpIp;
                saveTvConfig(tvConfig);
            }
        }
        connectToTv(8002);
    } else {
        // If no config, we must scan
        const found = await scanForTv();
        if (found) {
            connectToTv(8002);
        }
    }
}

// --- Telegram WebApp HMAC Authentication ---
function validateTelegramWebAppData(telegramInitData) {
    if (!telegramInitData) return null;
    try {
        const initData = new URLSearchParams(telegramInitData);
        const hash = initData.get('hash');
        if (!hash) return null;

        initData.delete('hash');
        initData.sort();

        const dataToCheck = [...initData.entries()]
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(BOT_TOKEN)
            .digest();

        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataToCheck)
            .digest('hex');

        if (hash !== calculatedHash) {
            return null;
        }

        const userStr = initData.get('user');
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch (e) {
        console.error('[Auth] Gagal validasi initData:', e.message);
        return null;
    }
}

io.use((socket, next) => {
    const headers = socket.handshake.headers;
    const isPublicTunnel = Boolean(
        headers['cf-ray'] || 
        headers['cf-connecting-ip'] || 
        (headers['host'] && headers['host'].includes('remote.malifadlan.dev'))
    );

    const initData = socket.handshake.auth?.initData;
    const user = validateTelegramWebAppData(initData);

    if (user && user.id && user.id.toString() === ALLOWED_USER_ID) {
        socket.data.user = user;
        console.log(`[Auth] User Telegram terotentikasi: ${user.username || user.first_name} (ID: ${user.id})`);
        return next();
    }

    // Izinkan akses langsung dari jaringan lokal (LAN) jika tidak lewat Cloudflare tunnel
    if (!isPublicTunnel) {
        const ip = socket.handshake.address;
        if (ip === '127.0.0.1' || ip === '::1' || ip.includes('192.168.1.') || ip.includes('127.0.0.1')) {
            console.log(`[Auth] Akses LAN diizinkan dari ${ip}`);
            return next();
        }
    }

    const clientIp = headers['cf-connecting-ip'] || socket.handshake.address;
    console.warn(`[Security] Akses ditolak dari IP: ${clientIp} (Bukan pemilik bot / tidak ada initData valid)`);
    return next(new Error('UNAUTHORIZED'));
});

io.on('connection', (socket) => {
    console.log('HP Terhubung ke Server Bridge!');
    
    if (tvConfig.ip && tvWs && tvWs.readyState === WebSocket.OPEN) {
        socket.emit('tv-status', `Terhubung ke ${tvConfig.name}`);
    } else if (tvConfig.ip) {
        socket.emit('tv-status', `Siap dor ke ${tvConfig.name}`);
    } else {
        socket.emit('tv-status', 'Belum terhubung ke TV');
    }
    
    socket.on('send-key', (key) => sendKey(key));
    socket.on('send-text', (text) => sendText(text));
    socket.on('mouse-move', (data) => sendMouseMove(data.dx, data.dy));
    socket.on('mouse-click', () => sendMouseClick());
    socket.on('force-scan', async () => {
        console.log('Menerima perintah force-scan dari HP');
        const found = await scanForTv();
        if (found) connectToTv(8002);
    });
});

async function startServer() {
    // Start network scan and connect logic
    scanAndConnect();

    // Serve static client built frontend
    const CLIENT_DIST = path.join(__dirname, '../client/dist');
    if (fs.existsSync(CLIENT_DIST)) {
        app.use(express.static(CLIENT_DIST));
        app.use((req, res) => {
            res.sendFile(path.join(CLIENT_DIST, 'index.html'));
        });
    }

    server.listen(PORT, '0.0.0.0');
}

startServer();
