# Tizen-QR: High-Performance Web-Based Samsung Smart TV Remote

[![Built with React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<div align="center">

https://github.com/user-attachments/assets/5bb51042-7140-4303-8093-5b3715b9bf02

<p><em>Scan QR / Buka di Peramban / Telegram Mini App -> Kontrol TV Anda</em></p>
</div>

**Tizen-QR** adalah solusi *remote control* berbasis web yang dirancang untuk ekosistem Samsung Smart TV (Tizen OS). Proyek ini mengeliminasi hambatan instalasi aplikasi tradisional dengan memanfaatkan arsitektur **Bridge Server** untuk komunikasi *low-latency* melalui protokol WebSocket, serta mendukung akses melalui browser publik, jaringan lokal (LAN), maupun Telegram Mini App.

---

## Fitur Utama

- **Zero-Install UX**: Dapat diakses langsung melalui peramban mobile (Chrome, Safari, Brave) atau sebagai Telegram WebApp tanpa instalasi dari app store.
- **Sistem Keamanan Berlapis (Defense-in-Depth)**:
  - **PIN Security & Rate Limiting**: Proteksi akses peramban publik dengan PIN rahasia. Dilengkapi pembatasan percobaan gagal berbasis IP (maksimal 5 kali kegagalan, diblokir sementara 1 menit) dan komparasi waktu konstan (`crypto.timingSafeEqual`).
  - **Telegram HMAC Authentication**: Otentikasi sesi Telegram Mini App dengan verifikasi tanda tangan HMAC-SHA256 serta validasi batas kedaluwarsa waktu `auth_date` (pencegahan replay attack).
  - **Input & Payload Validation**: Whitelist tombol Samsung (`KEY_*`), batasan teks (maksimal 2048 karakter), dan validasi delta pergerakan mouse pada Socket.IO.
- **Wake-on-LAN (WoL) & Dynamic ARP Resolution**: Menghidupkan TV dari mode *standby* menggunakan *Magic Packet* ke alamat MAC TV, serta kemampuan mendeteksi perubahan IP TV otomatis via tabel ARP sistem.
- **Full Control Suite**: D-Pad navigasi, pengaturan volume, pergantian channel, tombol navigasi sistem (Home, Return, Menu), hingga pintasan aplikasi (Netflix/YouTube).
- **Haptic Feedback Engine**: Memberikan sensasi getaran taktil saat tombol ditekan menggunakan browser Haptic API.
- **Penyimpanan Atomik & State Persistence**: Menyimpan pairing token TV di `tv-token.txt` dan konfigurasi TV di `tv-config.json` menggunakan mekanisme penulisan atomik (pencegahan korupsi berkas saat crash).
- **Modern Neumorphic UI**: Tampilan antarmuka modern dengan efek ambient glow, status bar terintegrasi, touchpad interaktif, dan keyboard virtual.

---

## Arsitektur Sistem (Bridge Server)

Arsitektur **Node.js Bridge Server** digunakan untuk menjembatani keterbatasan keamanan browser modern (CORS, mixed-content, dan sertifikat self-signed pada WebSocket TV).

```text
Smartphone / Telegram Mini App (Client)
       │
       │ [Socket.IO / Auth: PIN / HMAC]
       ▼
Node.js Bridge Server (Express + Socket.IO :3001)
       │
       │ [WebSocket WSS Port 8002 / HTTP Port 8001 / UDP WoL]
       ▼
Samsung Smart TV (Tizen OS)
```

---

## Konfigurasi Lingkungan (.env)

Server mendukung konfigurasi variabel lingkungan melalui berkas `server/.env`:

```env
# PIN untuk otentikasi akses peramban publik
REMOTE_PIN=2026

# Kredensial integrasi bot Telegram (opsional jika menggunakan Telegram Mini App)
TELEGRAM_BOT_TOKEN=your_bot_token_here
ALLOWED_USER_ID=your_telegram_user_id
```

---

## Panduan Instalasi & Menjalankan

### 1. Kloning Repositori
```bash
git clone https://github.com/MAliffadlan/Tizen-QR.git
cd Tizen-QR
```

### 2. Instalasi Dependensi
```bash
# Backend Server
cd server && npm install

# Frontend Client
cd ../client && npm install
```

### 3. Menjalankan Server & Client

**Menjalankan Backend Server:**
```bash
cd server
npm start
# atau node index.js
```

**Menjalankan Frontend (Development):**
```bash
cd client
npm run dev -- --host
```

**Membangun Frontend (Production):**
```bash
cd client
npm run build
```
Hasil build pada `client/dist` akan secara otomatis dilayani oleh Express pada port `3001`.

### 4. Pengujian Keamanan
Untuk menjalankan unit test keamanan dan validasi handler:
```bash
cd server
npm test
```

---

## Lisensi
Proyek ini merupakan pengembangan independen dan tidak berafiliasi dengan, diizinkan oleh, atau didukung oleh Samsung Electronics atau Tizen Association. "Tizen" adalah merek dagang dari Linux Foundation.
