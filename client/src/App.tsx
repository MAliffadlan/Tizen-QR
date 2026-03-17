import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, type TargetAndTransition } from 'framer-motion';
import {
  Power, VolumeX, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Home, ArrowLeft, Settings,
  Tv, Mic, Play, Pause,
  LayoutGrid, Youtube, FastForward, Rewind
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
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
          <RemoteButton onClick={() => sendKey('KEY_INFO')} className="btn-round btn-nav" style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>
            INFO
          </RemoteButton>
          <RemoteButton onClick={() => sendKey('KEY_TOOLS')} className="btn-round btn-nav" style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>
            TOOL
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
    </div>
  );
};

export default RemoteApp;
