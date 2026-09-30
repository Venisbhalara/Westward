import React, { useState, useEffect } from 'react';
import { Shield, Delete, Lock, ArrowRight } from 'lucide-react';

export default function PinAuthModal({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Keyboard support for typing PIN
  useEffect(() => {
    function handleKeyDown(e) {
      if (loading) return;
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 6) {
          handleKey(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading]);

  const handleKey = (digit) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 6) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError('');
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = async (fullPin) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Incorrect PIN code');
        setPin('');
      } else {
        onAuthenticated(data.token);
      }
    } catch (err) {
      setError('Connection failure. Check if server is running.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pin-auth-screen">
      <div className="pin-card">
        <h2 className="pin-brand-title">WESTWARD</h2>
        <p className="pin-subtitle">INDEPENDENT SPIRIT. CONSIDERED STYLE.</p>
        <div style={{ marginTop: 8, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--forest)', background: '#edf5ed', border: '1px solid #d4e7d4', padding: '3px 10px', borderRadius: 4, fontWeight: 700 }}>
          Executive Security Access
        </div>

        {/* 6 PIN Dots Indicator */}
        <div className="pin-dots-container">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
          ))}
        </div>

        {error && <div className="pin-error-banner">{error}</div>}

        {/* Tactile Keypad */}
        <div className="pin-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              className="pin-key-btn"
              onClick={() => handleKey(digit)}
              disabled={loading}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="pin-key-btn"
            style={{ fontSize: 13, color: '#9c9588' }}
            onClick={handleClear}
            disabled={loading || pin.length === 0}
          >
            CLEAR
          </button>
          <button
            type="button"
            className="pin-key-btn"
            onClick={() => handleKey('0')}
            disabled={loading}
          >
            0
          </button>
          <button
            type="button"
            className="pin-key-btn"
            onClick={handleBackspace}
            disabled={loading || pin.length === 0}
            aria-label="Backspace"
          >
            <Delete size={20} />
          </button>
        </div>

        <div style={{ marginTop: 26, fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: 0.5 }}>
          <Lock size={12} style={{ color: 'var(--forest)' }} />
          <span>Encrypted Session · Authorized Personnel Only</span>
        </div>
      </div>
    </div>
  );
}
