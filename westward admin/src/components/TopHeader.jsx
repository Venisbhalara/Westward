import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, ShieldAlert } from 'lucide-react';

export default function TopHeader({ title, onRefresh, refreshing }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="admin-top-header">
      <div className="header-left">
        <h2>{title}</h2>
      </div>

      <div className="header-right">
        {time && <div className="live-clock-badge">{time} IST</div>}

        <button
          type="button"
          className={`refresh-action-btn ${refreshing ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Sync latest database records"
        >
          <RefreshCw size={14} />
          <span>{refreshing ? 'Syncing...' : 'Live Sync'}</span>
        </button>

        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="refresh-action-btn"
          style={{ textDecoration: 'none' }}
          title="Open customer storefront"
        >
          <ExternalLink size={14} />
          <span>Storefront</span>
        </a>
      </div>
    </header>
  );
}
