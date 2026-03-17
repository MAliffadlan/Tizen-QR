# 📺 Tizen-QR: High-Performance Web-Based Samsung Smart TV Remote

[![Built with React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<div align="center">
  <br/>
  <video src="https://github.com/MAliffadlan/Tizen-QR-Remote-Samsung/raw/refs/heads/main/assets/video.mp4" width="800" controls="controls" muted="muted"></video>
  <br/>
  <p><em>📱 Scan QR → Open on phone → Control your TV</em></p>
</div>

**Tizen-QR** adalah solusi *remote control* berbasis web yang dirancang untuk ekosistem Samsung Smart TV (Tizen OS). Proyek ini mengeliminasi hambatan instalasi aplikasi tradisional dengan memanfaatkan **QR-based pairing** dan **Bridge Server Architecture** untuk komunikasi *low-latency* melalui protokol WebSocket.

---

## 🚀 Key Features

- **Zero-Install UX**: Cukup scan QR code dari terminal server, dan remote langsung aktif di browser smartphone tanpa perlu mengunduh aplikasi di Play Store/App Store.
- **Full Control Suite**: Navigasi D-Pad, Volume Control, Channel Switching, Home, Return, hingga App Shortcuts (Netflix/YouTube).
- **Wake-on-LAN (WoL)**: Menghidupkan TV dari mode *standby* menggunakan *Magic Packet* melalui alamat MAC TV, mengatasi masalah port WebSocket yang tertutup saat TV mati.
- **Haptic Feedback Engine**: Memberikan sensasi taktil (getaran) saat tombol ditekan menggunakan browser Haptic API untuk meningkatkan *user experience*.
- **State Persistence**: Otomatis menyimpan dan menggunakan kembali *pairing token* (di `tv-token.txt`) untuk koneksi instan di masa mendatang tanpa notifikasi "Allow/Deny" berulang.
- **Premium Neumorphic UI**: Antarmuka modern dengan gaya *Glassmorphism* dan *Neumorphism* yang elegan, dioptimalkan untuk perangkat mobile.

---

## 🏗️ System Architecture (The Bridge Server)

Salah satu aspek teknis paling krusial dalam proyek ini adalah penggunaan **Node.js Bridge Server**. Arsitektur ini dipilih untuk mengatasi batasan keamanan pada browser modern (CORS & Mixed Content).

```text
📱 Smartphone Browser (Client)
       │
       │ [Socket.IO / Event-Driven]
       ▼
🖥️ Node.js Bridge Server (The Bridge)
       │
       │ [WebSocket (WSS) / Port 8002]
       ▼
📺 Samsung Smart TV (Tizen OS)
```

### Mengapa Arsitektur Bridge?
1. **Bypassing SSL/CORS**: Browser smartphone melarang koneksi WebSocket langsung ke IP lokal TV yang menggunakan sertifikat *self-signed*. Bridge server menangani jabat tangan SSL secara *server-side*.
2. **Persistent Identification**: Server menggunakan `FIXED_ID` permanen agar TV Samsung mengenali perangkat sebagai remote yang sama, mencegah munculnya notifikasi pairing berulang kali.
3. **Network Discovery & WoL**: Memungkinkan server untuk mengirimkan paket UDP (WoL) yang tidak diizinkan langsung dari browser web smartphone.

---

## 🧠 Technical Challenges & Solutions

### 1. Bypassing SSL & Token Pairing
Samsung Smart TV (2016+) menggunakan port `8002` (WSS) dengan protokol keamanan yang ketat. 
- **Solusi**: Implementasi manual WebSocket menggunakan library `ws` di Node.js dengan flag `rejectUnauthorized: false`. Server menangkap event `ms.channel.connect`, mengekstrak token otentikasi, dan menyimpannya secara lokal untuk sesi berikutnya.

### 2. Wake-on-LAN Implementation
Saat TV dalam mode *standby*, port LAN/Wi-Fi seringkali mati total, menyebabkan error `EHOSTUNREACH`.
- **Solusi**: Integrasi library `wake_on_lan` untuk menembak *Magic Packet* ke MAC Address TV sesaat sebelum perintah `KEY_POWER` dikirimkan, memastikan TV "bangun" dan siap menerima koneksi WebSocket.

### 3. Low-Latency Interaction
Remote control membutuhkan respon instan agar terasa seperti remote fisik.
- **Solusi**: Menggunakan **Socket.IO** untuk jalur komunikasi dua arah (full-duplex) antara smartphone dan server, memastikan perintah diteruskan ke TV dalam waktu kurang dari 50ms.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, Lucide Icons |
| **Backend** | Node.js, Express, Socket.IO, WebSocket (ws) |
| **Networking** | Wake-on-LAN (UDP), QR-Code Terminal Generator |
| **Styling** | Neumorphic Design, Glassmorphism Effects |

---

## 📦 Installation & Setup

### 1. Clone & Install
```bash
git clone https://github.com/MAliffadlan/Tizen-QR.git
cd Tizen-QR
```

### 2. Configure TV Identity
Buka `server/index.js` dan sesuaikan IP serta MAC Address TV Anda:
```javascript
const TV_IP = '192.168.1.x';  // IP Smart TV Anda
const TV_MAC = 'XX:XX:XX:XX'; // MAC Address TV (untuk fitur WoL)
```

### 3. Run the Project
**Terminal 1 (Server Bridge):**
```bash
cd server && npm install && node index.js
```
**Terminal 2 (Web Client):**
```bash
cd client && npm install && npm run dev -- --host
```

---
"This project is an independent development and is not affiliated with, authorized, or endorsed by Samsung Electronics or the Tizen Association. 'Tizen' is a trademark of the Linux Foundation."

<p align="center">
  Developed with Precision & Determination by <strong>Bos Alif</strong> 🚀
</p>
