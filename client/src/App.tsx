import React, { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import {
  Power, VolumeX, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Home, ArrowLeft, Settings,
  Tv, Mic, Play, Pause,
  LayoutGrid, Youtube, FastForward, Rewind, Keyboard, Mouse
} from 'lucide-react';

let socket: Socket;

const RemoteButton: React.FC<{
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  whileTap?: TargetAndTransition;
  style?: React.CSSProperties;
}> = ({ onClick, className = '', children, whileTap, style }) => (
  <motion.button
    onClick={onClick}
    className={`btn-remote ${className}`}
    style={style}
    whileTap={whileTap || { scale: 0.88 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
  >
    {children}
  </motion.button>
);

const RemoteApp: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'scanning' | 'error'>('disconnected');
  const [statusMsg, setStatusMsg] = useState('Sedang menyambungkan...');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'instant' | 'bulk'>('instant');
  const [showTouchpad, setShowTouchpad] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const serverUrl = `http://${window.location.hostname}:3001`;
    socket = io(serverUrl);

    socket.on('connect', () => {
      setStatus('scanning');
      setStatusMsg('Terhubung ke Server Bridge');
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
      setStatusMsg('Server Bridge Terputus');
    });

    socket.on('tv-status', (msg: string) => {
      setStatusMsg(msg);

      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes('terhubung ke') || lowerMsg.includes('siap dor')) {
        setStatus('connected');
      } else if (lowerMsg.includes('melacak') || lowerMsg.includes('menghubungkan')) {
        setStatus('scanning');
      } else if (lowerMsg.includes('terputus') || lowerMsg.includes('gagal')) {
        setStatus('error');
      } else {
        setStatus('disconnected');
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  const sendKey = useCallback((key: string) => {
    if (navigator.vibrate) navigator.vibrate(30);
    socket.emit('send-key', key);
  }, []);

  const handleSendText = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'bulk' && textInput.trim()) {
      if (navigator.vibrate) navigator.vibrate(50);
      socket.emit('send-text', textInput);
      setTextInput('');
      setShowKeyboard(false);
    }
  }, [textInput, inputMode]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const oldValue = textInput;
    
    if (inputMode === 'instant') {
      if (newValue.length > oldValue.length) {
        // Huruf baru ditambahkan
        const newChar = newValue.slice(oldValue.length);
        if (navigator.vibrate) navigator.vibrate(15);
        socket.emit('send-text', newChar);
      } else if (newValue.length < oldValue.length) {
        // Backspace
        if (navigator.vibrate) navigator.vibrate(15);
        socket.emit('send-key', 'KEY_BACKSPACE');
      }
    }
    
    setTextInput(newValue);
  }, [textInput, inputMode]);

  const openKeyboard = useCallback(() => {
    setShowKeyboard(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Touchpad handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      movedRef.current = false;
    } else if (e.touches.length === 2) {
      // Two-finger scroll start
      const touch = e.touches[0];
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!lastTouchRef.current) return;

    if (e.touches.length === 1) {
      // One finger: Move Pointer
      const touch = e.touches[0];
      const dx = (touch.clientX - lastTouchRef.current.x) * 2.5; // Slightly faster pointer
      const dy = (touch.clientY - lastTouchRef.current.y) * 2.5;
      
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        movedRef.current = true;
        socket.emit('mouse-move', { dx, dy });
      }
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      
    } else if (e.touches.length === 2) {
      // Two fingers: Scroll Page (Using CHUP/CHDOWN for browser scrolling)
      const touch = e.touches[0];
      const dy = touch.clientY - lastTouchRef.current.y;
      
      // Threshold to trigger page up/down to prevent spamming
      if (Math.abs(dy) > 35) { 
        if (dy > 0) {
          socket.emit('send-key', 'KEY_CHDOWN'); // Swipe down -> Page Down
        } else {
          socket.emit('send-key', 'KEY_CHUP');   // Swipe up -> Page Up
        }
        if (navigator.vibrate) navigator.vibrate(10);
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!movedRef.current) {
      if (navigator.vibrate) navigator.vibrate(20);
      socket.emit('mouse-click');
    }
    lastTouchRef.current = null;
  }, []);

  return (
    <div className="remote-body">
      {/* Ambient glow effects */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      <motion.div
        className="remote-shell"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* IR Sensor */}
        <div className="ir-sensor" />

        {/* Top Bar */}
        <div className="top-bar">
          <div className="status-container">
            <div className={`status-dot ${status}`} />
            <span className="status-text">{statusMsg}</span>
          </div>
          <div className="top-right-actions">
            <RemoteButton onClick={() => socket.emit('force-scan')} className="btn-round" style={{ width: 36, height: 36, marginRight: 8 }}>
              <motion.div whileTap={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
              </motion.div>
            </RemoteButton>
            <RemoteButton onClick={() => sendKey('KEY_MENU')} className="btn-round" style={{ width: 36, height: 36 }}>
              <Settings size={14} />
            </RemoteButton>
          </div>
        </div>

        {/* Power, Source, Mic Row */}
        <div className="top-controls">
          <RemoteButton onClick={() => sendKey('KEY_POWER')} className="btn-round btn-power">
            <Power size={22} />
          </RemoteButton>

          <RemoteButton onClick={() => sendKey('KEY_SOURCE')} className="btn-round">
            <Tv size={20} />
          </RemoteButton>

          <RemoteButton onClick={() => sendKey('KEY_AMBIENT')} className="btn-round">
            <Mic size={20} />
          </RemoteButton>
        </div>

        {/* Number Pad */}
        <div className="numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <RemoteButton
              key={num}
              onClick={() => sendKey(`KEY_${num}`)}
              className="btn-remote btn-num"
            >
              {num}
            </RemoteButton>
          ))}
          <RemoteButton onClick={() => sendKey('KEY_PRECH')} className="btn-remote btn-num">
            ←
          </RemoteButton>
          <RemoteButton onClick={() => sendKey('KEY_0')} className="btn-remote btn-num">
            0
          </RemoteButton>
          <RemoteButton onClick={() => sendKey('KEY_TTX_MIX')} className="btn-remote btn-num">
            TTX
          </RemoteButton>
        </div>

        <div className="divider" />

        {/* Volume + Channel Rockers with Center Home/Back */}
        <div className="rocker-section">
          {/* Volume Rocker */}
          <div className="rocker">
            <button onClick={() => sendKey('KEY_VOLUP')}>
              <ChevronUp size={24} />
            </button>
            <span className="rocker-label">VOL</span>
            <button onClick={() => sendKey('KEY_VOLDOWN')}>
              <ChevronDown size={24} />
            </button>
          </div>

          {/* Center: Home + Mute + Back */}
          <div className="center-controls">
            <RemoteButton onClick={() => sendKey('KEY_HOME')} className="btn-round" style={{ width: 48, height: 48 }}>
              <Home size={20} style={{ color: '#60a5fa' }} />
            </RemoteButton>
            <RemoteButton onClick={() => sendKey('KEY_MUTE')} className="btn-round btn-mute">
              <VolumeX size={16} />
            </RemoteButton>
            <RemoteButton onClick={() => sendKey('KEY_RETURN')} className="btn-round" style={{ width: 48, height: 48 }}>
              <ArrowLeft size={20} />
            </RemoteButton>
          </div>

          {/* Channel Rocker */}
          <div className="rocker">
            <button onClick={() => sendKey('KEY_CHUP')}>
              <ChevronUp size={24} />
            </button>
            <span className="rocker-label">CH</span>
            <button onClick={() => sendKey('KEY_CHDOWN')}>
              <ChevronDown size={24} />
            </button>
          </div>
        </div>

        <div className="divider" />

        {/* D-PAD */}
        <div className="dpad-container">
          <div className="dpad-ring" />

          <button className="dpad-btn up" onClick={() => sendKey('KEY_UP')}>
            <ChevronUp size={36} />
          </button>
          <button className="dpad-btn down" onClick={() => sendKey('KEY_DOWN')}>
            <ChevronDown size={36} />
          </button>
          <button className="dpad-btn left" onClick={() => sendKey('KEY_LEFT')}>
            <ChevronLeft size={36} />
          </button>
          <button className="dpad-btn right" onClick={() => sendKey('KEY_RIGHT')}>
            <ChevronRight size={36} />
          </button>

          <motion.button
            className="dpad-ok"
            onClick={() => sendKey('KEY_ENTER')}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            OK
          </motion.button>
        </div>

        {/* Color Dots */}
        <div className="color-dots">
          <button className="color-dot red" onClick={() => sendKey('KEY_RED')} />
          <button className="color-dot green" onClick={() => sendKey('KEY_GREEN')} />
          <button className="color-dot yellow" onClick={() => sendKey('KEY_YELLOW')} />
          <button className="color-dot blue" onClick={() => sendKey('KEY_BLUE')} />
        </div>

        <div className="divider" />

        {/* Navigation Row */}
        <div className="nav-row">
          <RemoteButton onClick={() => sendKey('KEY_GUIDE')} className="btn-round btn-nav">
            <LayoutGrid size={18} />
          </RemoteButton>
          <RemoteButton onClick={openKeyboard} className="btn-round btn-nav btn-keyboard">
            <Keyboard size={18} />
          </RemoteButton>
          <RemoteButton onClick={() => setShowTouchpad(true)} className="btn-round btn-nav btn-mouse">
            <Mouse size={18} />
          </RemoteButton>
          <RemoteButton onClick={() => sendKey('KEY_INFO')} className="btn-round btn-nav" style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>
            INFO
          </RemoteButton>
        </div>

        {/* Media Controls */}
        <div className="media-row">
          <RemoteButton onClick={() => sendKey('KEY_REWIND')} className="btn-round btn-media">
            <Rewind size={16} />
          </RemoteButton>
          <RemoteButton onClick={() => sendKey('KEY_PLAY')} className="btn-round btn-media">
            <Play size={16} style={{ marginLeft: 2 }} />
          </RemoteButton>
          <RemoteButton onClick={() => sendKey('KEY_PAUSE')} className="btn-round btn-media">
            <Pause size={16} />
          </RemoteButton>
          <RemoteButton onClick={() => sendKey('KEY_FF')} className="btn-round btn-media">
            <FastForward size={16} />
          </RemoteButton>
        </div>

        <div className="divider" />

        {/* App Shortcuts */}
        <div className="app-row">
          <RemoteButton onClick={() => sendKey('KEY_VOD')} className="btn-pill btn-app btn-netflix">
            <Play size={14} style={{ fill: 'currentColor' }} />
            <span>NETFLIX</span>
          </RemoteButton>
          <RemoteButton onClick={() => sendKey('KEY_EXTRA')} className="btn-pill btn-app btn-youtube">
            <Youtube size={16} />
            <span>YouTube</span>
          </RemoteButton>
        </div>

        {/* Footer */}
        <div className="remote-footer">
          Boss Alif Remote
        </div>
      </motion.div>

      {/* Touchpad Overlay */}
      <AnimatePresence>
        {showTouchpad && (
          <motion.div
            className="touchpad-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="touchpad-header">
              <span className="touchpad-label">🖱️ Touchpad Mode</span>
              <button className="touchpad-close" onClick={() => setShowTouchpad(false)}>✕</button>
            </div>
            <div
              className="touchpad-area"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="touchpad-hint">
                <p>👆 <strong>Geser 1 jari:</strong> Pindah Pointer</p>
                <p>🖱️ <strong>Tap layarnya:</strong> Klik</p>
              </div>
            </div>
            <div className="touchpad-buttons">
              <button className="touchpad-btn" onClick={() => { if (navigator.vibrate) navigator.vibrate(20); socket.emit('mouse-click'); }}>
                Klik Kiri
              </button>
              <button className="touchpad-btn" onClick={() => sendKey('KEY_RETURN')}>
                Kembali
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Modal */}
      <AnimatePresence>
        {showKeyboard && (
          <motion.div
            className="keyboard-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowKeyboard(false); setTextInput(''); }}
          >
            <motion.form
              className="keyboard-modal"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSendText}
            >
              <div className="keyboard-header">
                <span className="keyboard-label">Ketik untuk TV ⌨️</span>
                <div className="keyboard-mode-toggle">
                  <button 
                    type="button" 
                    className={`mode-btn ${inputMode === 'instant' ? 'active' : ''}`}
                    onClick={() => setInputMode('instant')}
                  >
                    YouTube
                  </button>
                  <button 
                    type="button" 
                    className={`mode-btn ${inputMode === 'bulk' ? 'active' : ''}`}
                    onClick={() => setInputMode('bulk')}
                  >
                    Browser
                  </button>
                </div>
              </div>
              <p className="keyboard-hint">
                {inputMode === 'instant' 
                  ? 'Setiap huruf langsung terkirim ke TV' 
                  : 'Ketik semua lalu tekan Kirim'}
              </p>
              <input
                ref={inputRef}
                type="text"
                className="keyboard-input"
                placeholder={inputMode === 'instant' ? 'Mulai ketik...' : 'Cari YouTube, Netflix...'}
                value={textInput}
                onChange={handleInputChange}
                autoComplete="off"
                autoCorrect="off"
              />
              {inputMode === 'bulk' && (
                <button type="submit" className="keyboard-send-btn">
                  Kirim ke TV
                </button>
              )}
              {inputMode === 'instant' && (
                <button 
                  type="button" 
                  className="keyboard-send-btn"
                  onClick={() => { setTextInput(''); setShowKeyboard(false); }}
                >
                  Selesai
                </button>
              )}
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RemoteApp;
