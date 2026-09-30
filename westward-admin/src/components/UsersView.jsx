import React, { useState } from 'react';
import { Users, Search, ShoppingBag, DollarSign, Calendar } from 'lucide-react';

function money(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function UsersView({ users }) {
  const [search, setSearch] = useState('');

  const filteredUsers = (users || []).filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="view-container">
      <div className="data-panel-card">
        <div className="panel-header-bar">
          <div className="panel-title">
            <h3>
              <Users size={18} style={{ color: 'var(--forest)' }} />
              Registered Customer Directory ({filteredUsers.length})
            </h3>
          </div>
          <div className="panel-controls">
            <div className="search-input-wrap">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search by patron name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Patron Identity</th>
                <th>Email Address</th>
                <th>Registered Date</th>
                <th>Order Count</th>
                <th>Lifetime Spend</th>
                <th>Loyalty Tier</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: 40, color: 'var(--muted-foreground)' }}
                  >
                    No customers found matching "{search}".
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initial = (u.name || 'P').charAt(0).toUpperCase();
                  const registeredDate = u.created_at
                    ? new Date(u.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Verified Member';

                  const spend = Number(u.totalSpent || 0);
                  const tier =
                    spend >= 30000
                      ? { label: 'Private VIP', color: '#2f5233', bg: '#edf5ed', border: '#d4e7d4' }
                      : spend >= 10000
                      ? { label: 'Patron', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' }
                      : { label: 'Member', color: '#706d63', bg: '#f3efe6', border: '#ded9cd' };

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: '#f3efe6',
                              border: '1px solid var(--border)',
                              color: 'var(--foreground)',
                              fontFamily: 'Georgia, serif',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 15,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--subtle)' }}>
                              ID: {u.id?.slice(0, 10)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--muted-foreground)' }}>{u.email}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>
                          <Calendar size={13} />
                          <span>{registeredDate}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{u.orderCount || 0} orders</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                        {money(u.totalSpent)}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: 4,
                            background: tier.bg,
                            border: `1px solid ${tier.border}`,
                            color: tier.color,
                          }}
                        >
                          {tier.label}
                        </span>
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
