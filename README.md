# 📺 Smart TV Web Remote

A sleek, web-based remote control for Samsung Smart TVs. Control your TV directly from your phone or any browser on your local network — no app install needed. Just scan the QR code and you're in!

![Built with React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06b6d4?logo=tailwindcss&logoColor=white)

## ✨ Features

- 🎮 **Full Remote Control** — Power, Volume, Channel, D-Pad, Number Pad, Color Buttons, Media Controls
- 📱 **QR Code Pairing** — Start the server and scan the QR to open the remote on your phone instantly
- ⚡ **Wake-on-LAN** — Turn on your TV even when it's in standby mode via magic packet
- 🔌 **WebSocket Connection** — Direct, low-latency communication with your Samsung TV
- 🔐 **Token-Based Auth** — Automatically saves and reuses the TV pairing token
- 📲 **Haptic Feedback** — Vibrates on button press for a tactile feel (on supported devices)
- 🎨 **Premium Dark UI** — Neumorphic design with smooth Framer Motion animations
- 🔄 **Auto-Reconnect** — Automatically reconnects if the TV connection drops

## 🎬 Demo

<div align="center">

https://github.com/user-attachments/assets/a65dd7c9-8c33-4564-8800-4e48b0f75198

<p><em>📱 Scan QR → Open on phone → Control your TV</em></p>

</div>

## 🖼️ UI Highlights

| Section | Description |
|---------|-------------|
| 🔴 **Top Controls** | Power, Source, Mic, Settings |
| 🔢 **Number Pad** | 0-9, Previous Channel, TTX |
| 🔊 **Rockers** | Volume & Channel with Home, Mute, Back |
| 🕹️ **D-Pad** | Directional navigation + OK |
| 🟢🟡🔵🔴 **Color Dots** | Red, Green, Yellow, Blue function keys |
| ⏯️ **Media** | Play, Pause, Rewind, Fast Forward |
| 📺 **App Shortcuts** | Netflix & YouTube quick launch |

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express, Socket.IO, WebSocket (`ws`) |
| **TV Control** | Samsung WebSocket API (`wss://<TV_IP>:8002`) |
| **Extras** | QR Code generation, Wake-on-LAN, Haptic Vibration API |

## 📋 Prerequisites

- **Node.js** ≥ 18
- **Samsung Smart TV** (2016+ models with WebSocket API support)
- Both your TV and the device running this server must be on the **same local network**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/MAliffadlan/Tizen-QR-Remote-Samsung.git
cd Tizen-QR-Remote-Samsung
```

### 2. Configure the Server

Edit `server/index.js` and update these values to match your TV:

```js
const TV_IP = '192.168.1.3';       // Your TV's local IP address
const TV_MAC = '64:1c:ae:fd:c1:b6'; // Your TV's MAC address (for Wake-on-LAN)
```

### 3. Install Dependencies & Run

```bash
# Install server dependencies
cd server
npm install

# Start the server (bridge between your phone and TV)
node index.js

# In a new terminal, install and start the client
cd client
npm install
npm run dev
```

### 4. Connect Your Phone

When the server starts, it will display a **QR code** in the terminal. Scan it with your phone to open the remote control UI. Make sure your phone is on the same WiFi network.

> **First-time pairing:** Your TV may show a popup asking you to allow the connection. Accept it, and the token will be saved automatically for future use.

## 📁 Project Structure

```
samsung-remote-qr/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── App.tsx          # Remote control UI component
│   │   ├── index.css        # Premium dark theme styles
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                  # Node.js backend
│   ├── index.js             # WebSocket bridge + QR + WoL
│   ├── tv-token.txt         # Saved TV pairing token
│   └── package.json
└── README.md
```

## ⚙️ How It Works

```
📱 Phone Browser
      │
      │ Socket.IO
      ▼
🖥️ Node.js Server (Bridge)
      │
      │ WebSocket (WSS)
      ▼
📺 Samsung Smart TV
```

1. The **server** connects to your Samsung TV via WebSocket and generates a QR code
2. You **scan the QR code** on your phone to open the React remote UI
3. Button presses are sent via **Socket.IO** to the server
4. The server forwards the key commands to the TV via **WebSocket**
5. Pressing **Power** also sends a **Wake-on-LAN** magic packet to wake the TV from standby

## 🔑 Supported Keys

| Category | Keys |
|----------|------|
| **Power** | `KEY_POWER` |
| **Navigation** | `KEY_UP`, `KEY_DOWN`, `KEY_LEFT`, `KEY_RIGHT`, `KEY_ENTER` |
| **Volume** | `KEY_VOLUP`, `KEY_VOLDOWN`, `KEY_MUTE` |
| **Channel** | `KEY_CHUP`, `KEY_CHDOWN`, `KEY_PRECH` |
| **Numbers** | `KEY_0` — `KEY_9` |
| **Media** | `KEY_PLAY`, `KEY_PAUSE`, `KEY_REWIND`, `KEY_FF` |
| **Colors** | `KEY_RED`, `KEY_GREEN`, `KEY_YELLOW`, `KEY_BLUE` |
| **System** | `KEY_HOME`, `KEY_RETURN`, `KEY_MENU`, `KEY_SOURCE`, `KEY_INFO`, `KEY_GUIDE`, `KEY_TOOLS` |
| **Apps** | `KEY_VOD` (Netflix), `KEY_EXTRA` (YouTube) |

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---
"This project is an independent development and is not affiliated with, authorized, or endorsed by Samsung Electronics or the Tizen Association. 'Tizen' is a trademark of the Linux Foundation."

<p align="center">
  Made with ❤️ by <strong>Boss Alif</strong>
</p>
