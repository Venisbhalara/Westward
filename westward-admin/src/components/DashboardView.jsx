import React from 'react';
import {
  DollarSign,
  ShoppingBag,
  Users,
  MessageSquare,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Package,
} from 'lucide-react';

function money(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function DashboardView({ stats, onSelectOrder, onNavigate }) {
  if (!stats) return <div className="view-container">Loading overview statistics...</div>;

  return (
    <div className="view-container">
      {/* 4 Primary KPI Cards */}
      <div className="kpi-cards-grid">
        {/* Total Revenue */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Gross Revenue</span>
            <div className="kpi-icon-wrap">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value">{money(stats.totalRevenue)}</div>
          <div className="kpi-footer">
            <ArrowUpRight size={13} style={{ color: '#4ade80' }} />
            <span>Across {stats.totalOrders} total confirmed transactions</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Total Orders</span>
            <div className="kpi-icon-wrap">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="kpi-value">{stats.totalOrders}</div>
          <div className="kpi-footer">
            <span>Avg Value: {money(stats.avgOrderValue)}</span>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Registered Patrons</span>
            <div className="kpi-icon-wrap">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{stats.totalUsers}</div>
          <div className="kpi-footer">
            <span>Verified accounts in westward_db</span>
          </div>
        </div>

        {/* Support Inquiries */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Customer Concierge</span>
            <div className="kpi-icon-wrap" style={{ color: stats.pendingInquiries > 0 ? '#b91c1c' : 'var(--foreground)' }}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="kpi-value">{stats.pendingInquiries}</div>
          <div className="kpi-footer">
            <span>{stats.pendingInquiries} open / {stats.totalInquiries} total requests</span>
          </div>
        </div>
      </div>

      {/* Orders Status Distribution Strip */}
      <div className="data-panel-card">
        <div className="panel-header-bar">
          <div className="panel-title">
            <h3>
              <Package size={18} style={{ color: 'var(--forest)' }} />
              Live Order Fulfillment Pipeline
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon-action"
            onClick={() => onNavigate('orders')}
          >
            Manage All Orders →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, padding: 20 }}>
          {['Confirmed', 'Atelier Prep', 'Dispatched', 'Delivered', 'Cancelled'].map((st) => {
            const count = stats.statusBreakdown?.[st] || 0;
            const colors = {
              Confirmed: { color: '#2f5233', bg: '#edf5ed', border: '#d4e7d4' },
              'Atelier Prep': { color: '#a16207', bg: '#fcf8ed', border: '#fde68a' },
              Dispatched: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
              Delivered: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
              Cancelled: { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
            }[st];

            return (
              <div
                key={st}
                style={{
                  background: colors.bg,
                  borderRadius: 6,
                  padding: 16,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: colors.color }}>{st}</span>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: colors.color,
                    }}
                  />
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400, color: 'var(--foreground)' }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Feed */}
      <div className="data-panel-card">
        <div className="panel-header-bar">
          <div className="panel-title">
            <h3>
              <Clock size={18} style={{ color: 'var(--forest)' }} />
              Recent Atelier Orders
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon-action"
            onClick={() => onNavigate('orders')}
          >
            View Full Register ({stats.totalOrders})
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Recipient</th>
                <th>Purchased Items</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Placed At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders?.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                    No orders placed yet. As soon as a customer checks out, it will appear here in real time.
                  </td>
                </tr>
              ) : (
                stats.recentOrders?.map((order) => {
                  const statusClass =
                    order.status === 'Confirmed'
                      ? 'confirmed'
                      : order.status === 'Atelier Prep'
                      ? 'prep'
                      : order.status === 'Dispatched'
                      ? 'dispatched'
                      : order.status === 'Delivered'
                      ? 'delivered'
                      : 'cancelled';

                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Just now';

                  return (
                    <tr key={order.id}>
                      <td>
                        <span className="order-id-badge">{order.id}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.address?.name || 'Valued Guest'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {order.address?.city ? `${order.address.city}, India` : 'Standard Delivery'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12 }}>
                          {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {money(order.total)}
                      </td>
                      <td>
                        <span className={`status-pill ${statusClass}`}>{order.status}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dateStr}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => onSelectOrder(order)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
