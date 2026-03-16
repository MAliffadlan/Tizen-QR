const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const qrcode = require('qrcode');
const { internalIpV4 } = require('internal-ip');
const fs = require('fs');
const path = require('path');
const wol = require('wake_on_lan'); // Tambahin library WoL

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 3001;
const TOKEN_FILE = path.join(__dirname, 'tv-token.txt');
const TV_IP = '192.168.1.3';
const TV_MAC = '64:1c:ae:fd:c1:b6'; // MAC TV BOS ALIF
const REMOTE_NAME = 'Remote_Alif_Paten';
const FIXED_ID = 'alif_smart_remote_id_999';

let tvWs = null;

function getSavedToken() {
    if (fs.existsSync(TOKEN_FILE)) return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    return '';
}

function connectToTv() {
    if (tvWs && tvWs.readyState === WebSocket.OPEN) return;

    const token = getSavedToken();
    const encodedName = Buffer.from(REMOTE_NAME).toString('base64');
    const wsUrl = `wss://${TV_IP}:8002/api/v2/channels/samsung.remote.control?name=${encodedName}${token ? `&token=${token}` : ''}&id=${FIXED_ID}`;

    console.log(`\n--- MENCOBA KONEKSI ---`);
    console.log(`IP: ${TV_IP} | Token: ${token || 'BELUM ADA'}`);
    
    tvWs = new WebSocket(wsUrl, { rejectUnauthorized: false });

    tvWs.on('open', () => {
        console.log('Handshake WebSocket Terbuka!');
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
        console.log('Koneksi TV putus, nyambung lagi...');
        setTimeout(connectToTv, 3000);
    });

    tvWs.on('error', (err) => console.error('WS Error:', err.message));
}

function sendKey(key) {
    // JIKA TOMBOL POWER DIPENCET: Kita tembak WoL dulu buat jaga-jaga TV lagi mati
    if (key === 'KEY_POWER') {
        console.log('--- MENGIRIM MAGIC PACKET (WAKE-ON-LAN) ---');
        wol.wake(TV_MAC, (error) => {
            if (error) console.error('WoL Error:', error);
            else console.log('Magic Packet terkirim ke MAC: ' + TV_MAC);
        });
    }

    if (!tvWs || tvWs.readyState !== WebSocket.OPEN) {
        console.log('Koneksi belum siap, mencoba menyambung kembali...');
        connectToTv();
        // Beri waktu sebentar buat nyambung kalo TV baru bangun dari WoL
        setTimeout(() => {
            if (tvWs && tvWs.readyState === WebSocket.OPEN) {
                doSendKey(key);
            }
        }, 1500);
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

    console.log(`Dor: ${key}`);
    tvWs.send(JSON.stringify(payload));
}

connectToTv();

io.on('connection', (socket) => {
    console.log('HP Konek!');
    socket.emit('tv-status', 'Siap dor ke ' + TV_IP);
    socket.on('send-key', (key) => sendKey(key));
});

async function startServer() {
    const localIp = await internalIpV4();
    console.log(`\nBridge: http://${localIp}:${PORT}`);
    qrcode.toString(`http://${localIp}:5173`, { type: 'terminal', small: true }, (err, url) => {
        console.log('\nSCAN QR NYA BOS ALIF:\n');
        console.log(url);
    });
    server.listen(PORT, '0.0.0.0');
}

startServer();
