import React, { useState } from 'react';
import { MessageSquare, Search, Mail, Phone, Calendar, CheckCircle2, Clock, X } from 'lucide-react';

export default function InquiriesView({ inquiries, onUpdateStatus }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updating, setUpdating] = useState(false);

  const filtered = (inquiries || []).filter((inq) => {
    const matchesStatus = statusFilter === 'all' || (inq.status || 'new') === statusFilter;
    const q = search.toLowerCase().trim();
    if (!q) return matchesStatus;
    return (
      matchesStatus &&
      ((inq.name || '').toLowerCase().includes(q) ||
        (inq.email || '').toLowerCase().includes(q) ||
        (inq.subject || '').toLowerCase().includes(q) ||
        (inq.id || '').toLowerCase().includes(q))
    );
  });

  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdating(true);
    try {
      await onUpdateStatus(ticketId, newStatus);
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="view-container">
      <div className="data-panel-card">
        <div className="panel-header-bar">
          <div className="panel-title">
            <h3>
              <MessageSquare size={18} style={{ color: 'var(--forest)' }} />
              Customer Inquiries & Concierge Tickets ({filtered.length})
            </h3>
          </div>
          <div className="panel-controls">
            <div className="search-input-wrap">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search ticket, name, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Inquiries</option>
              <option value="new">New (Unresolved)</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Sender</th>
                <th>Subject Topic</th>
                <th>Status</th>
                <th>Submitted On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted-foreground)' }}>
                    No support tickets found matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => {
                  const statusTag =
                    ticket.status === 'resolved'
                      ? { label: 'Resolved', class: 'confirmed' }
                      : ticket.status === 'in_progress'
                      ? { label: 'In Progress', class: 'prep' }
                      : { label: 'New Inquiry', class: 'cancelled' };

                  const dateStr = ticket.created_at
                    ? new Date(ticket.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  return (
                    <tr key={ticket.id}>
                      <td>
                        <span className="order-id-badge">{ticket.id}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ticket.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{ticket.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>{ticket.subject}</div>
                        <div style={{ fontSize: 11, color: 'var(--subtle)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ticket.message}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${statusTag.class}`}>{statusTag.label}</span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{dateStr}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          Read & Resolve
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

      {/* Ticket Reader Modal */}
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div
            className="modal-content-card"
            style={{ maxWidth: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span style={{ fontSize: 11, letterSpacing: 1.5, color: 'var(--forest)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Concierge Ticket
                </span>
                <h3>{selectedTicket.id}</h3>
              </div>
              <button
                type="button"
                className="btn-icon-action"
                style={{ padding: 6 }}
                onClick={() => setSelectedTicket(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  background: 'var(--background)',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>
                    {selectedTicket.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                    {selectedTicket.email} {selectedTicket.phone ? `· ${selectedTicket.phone}` : ''}
                  </div>
                  {selectedTicket.order_id && (
                    <div style={{ fontSize: 11, color: 'var(--forest)', marginTop: 4 }}>
                      Associated Order ID: <strong>{selectedTicket.order_id}</strong>
                    </div>
                  )}
                </div>

                <select
                  className="filter-select"
                  value={selectedTicket.status || 'new'}
                  disabled={updating}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  style={{ background: '#ffffff', fontWeight: 600 }}
                >
                  <option value="new">New (Unresolved)</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted-foreground)' }}>
                  Topic / Subject
                </strong>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', marginTop: 4 }}>
                  {selectedTicket.subject}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted-foreground)' }}>
                  Patron's Inquired Message
                </strong>
                <div
                  style={{
                    background: 'var(--background)',
                    padding: 18,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: 'var(--foreground)',
                    marginTop: 8,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedTicket.message}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <a
                href={`mailto:${selectedTicket.email}?subject=WESTWARD%20Atelier%20Response%20-%20Ticket%20${selectedTicket.id}`}
                className="btn-icon-action"
                style={{ textDecoration: 'none' }}
              >
                <Mail size={15} />
                <span>Reply via Email</span>
              </a>
              <button
                type="button"
                className="btn-icon-action btn-primary-action"
                onClick={() => setSelectedTicket(null)}
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
