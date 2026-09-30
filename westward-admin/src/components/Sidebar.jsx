import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  MessageSquare,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export default function Sidebar({ currentView, setView, stats, onLock }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: stats?.totalOrders || null,
    },
    {
      id: 'users',
      label: 'Customers',
      icon: Users,
      badge: stats?.totalUsers || null,
    },
    {
      id: 'products',
      label: 'Catalog & Stock',
      icon: Package,
      badge: null,
    },
    {
      id: 'inquiries',
      label: 'Inquiries',
      icon: MessageSquare,
      badge: stats?.pendingInquiries > 0 ? stats.pendingInquiries : null,
      badgeAlert: stats?.pendingInquiries > 0,
    },
  ];

  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <a href="/" className="sidebar-wordmark">
          WESTWARD
          <span>INDEPENDENT SPIRIT. CONSIDERED STYLE.</span>
        </a>
        <div className="admin-badge-tag">
          <ShieldCheck size={12} />
          <span>EXECUTIVE ADMIN</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-button ${isActive ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <div className="nav-item-left">
                <Icon size={18} />
                <span className="nav-text">{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className="nav-pill"
                  style={
                    item.badgeAlert
                      ? { background: '#d94b41', color: '#fff' }
                      : undefined
                  }
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer with MySQL Status & Lock button */}
      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <div className="status-dot-pulse" />
          <span>MySQL Realtime Synced</span>
        </div>
        <button type="button" className="lock-session-btn" onClick={onLock}>
          <Lock size={14} />
          <span>Lock Admin Session</span>
        </button>
      </div>
    </aside>
  );
}
