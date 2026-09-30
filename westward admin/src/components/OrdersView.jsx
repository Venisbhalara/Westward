import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  Package,
  MapPin,
  Clock,
  Printer,
  X,
  CheckCircle2,
  Truck,
  ExternalLink,
  Copy,
  Check,
  CreditCard,
  User,
  Mail,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

function money(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getProductImageUrl(img) {
  if (!img) return 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.endsWith('.jpg') || img.endsWith('.png') || img.endsWith('.webp')) {
    return `http://localhost:5173/images/${img}`;
  }
  return `http://localhost:5173/images/${img}.jpg`;
}

const PIPELINE_STAGES = [
  { id: 'Confirmed', label: 'Confirmed', sub: 'Order Verified', icon: CheckCircle2 },
  { id: 'Atelier Prep', label: 'Atelier Prep', sub: 'Craft & Quality Pack', icon: Package },
  { id: 'Dispatched', label: 'Dispatched', sub: 'In Courier Transit', icon: Truck },
  { id: 'Delivered', label: 'Delivered', sub: 'Handed to Patron', icon: ShieldCheck },
];

export default function OrdersView({
  orders,
  selectedOrder,
  setSelectedOrder,
  onUpdateStatus,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && selectedOrder) {
        setSelectedOrder(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder, setSelectedOrder]);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (o.status || 'Confirmed').toLowerCase() === statusFilter.toLowerCase();

    const q = search.toLowerCase().trim();
    if (!q) return matchesStatus;

    const matchId = (o.id || '').toLowerCase().includes(q);
    const matchName = (o.address?.name || '').toLowerCase().includes(q);
    const matchEmail = (o.address?.email || '').toLowerCase().includes(q);
    const matchCity = (o.address?.city || '').toLowerCase().includes(q);
    return matchesStatus && (matchId || matchName || matchEmail || matchCity);
  });

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await onUpdateStatus(orderId, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  const copyOrderId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Helper calculations for modal
  const orderItems = selectedOrder?.items || [];
  const itemsSubtotal = orderItems.reduce(
    (acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0
  );
  const estimatedGst = Math.round(((selectedOrder?.total || itemsSubtotal) * 0.12) / 1.12);

  const currentStageIdx = PIPELINE_STAGES.findIndex(
    (s) => s.id === (selectedOrder?.status || 'Confirmed')
  );
  const nextStage =
    currentStageIdx >= 0 && currentStageIdx < PIPELINE_STAGES.length - 1
      ? PIPELINE_STAGES[currentStageIdx + 1]
      : null;

  const orderDateFormatted = selectedOrder?.createdAt || selectedOrder?.created_at
    ? new Date(selectedOrder.createdAt || selectedOrder.created_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'Just now';

  return (
    <div className="view-container">
      {/* Top Filter and Search Bar */}
      <div className="data-panel-card">
        <div className="panel-header-bar">
          <div className="panel-title">
            <h3>
              <Package size={18} style={{ color: 'var(--forest)' }} />
              All Customer Orders ({filteredOrders.length})
            </h3>
          </div>
          <div className="panel-controls">
            <div className="search-input-wrap">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search by ID, name, email, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Atelier Prep">Atelier Prep</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table of Orders */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Recipient & City</th>
                <th>Pieces Ordered</th>
                <th>Total Value</th>
                <th>Fulfillment Status</th>
                <th>Ordered On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: 'center', padding: 40, color: 'var(--muted-foreground)' }}
                  >
                    No matching orders found. Try adjusting your search query or filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
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

                  const dateStr = order.createdAt || order.created_at
                    ? new Date(order.createdAt || order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A';

                  return (
                    <tr key={order.id}>
                      <td>
                        <span className="order-id-badge">{order.id}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                          {order.address?.name || 'Patron'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                          {order.address?.email} · {order.address?.city || 'India'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          {order.items?.length || 0} product
                          {(order.items?.length || 0) === 1 ? '' : 's'} (
                          {order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0} units)
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                        {money(order.total)}
                      </td>
                      <td>
                        <span className={`status-pill ${statusClass}`}>{order.status}</span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{dateStr}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Inspect & Fulfill
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

      {/* Layered, Structured Atelier Fulfillment Dossier Modal */}
      {selectedOrder &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div
            className="modal-content-card"
            style={{ maxWidth: 860 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Dossier Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: 1.5,
                      color: 'var(--forest)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      background: '#edf5ed',
                      border: '1px solid #d4e7d4',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    WESTWARD ATELIER · FULFILLMENT DOSSIER
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    <Clock size={12} />
                    <span>{orderDateFormatted}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                  <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 600 }}>
                    Order Ref: {selectedOrder.id}
                  </h3>
                  <button
                    type="button"
                    onClick={() => copyOrderId(selectedOrder.id)}
                    title="Copy Order ID"
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '3px 8px',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: copiedId ? 'var(--forest)' : 'var(--muted-foreground)',
                    }}
                  >
                    {copiedId ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  className={`status-pill ${
                    selectedOrder.status === 'Confirmed'
                      ? 'confirmed'
                      : selectedOrder.status === 'Atelier Prep'
                      ? 'prep'
                      : selectedOrder.status === 'Dispatched'
                      ? 'dispatched'
                      : selectedOrder.status === 'Delivered'
                      ? 'delivered'
                      : 'cancelled'
                  }`}
                  style={{ fontSize: 12, padding: '5px 12px' }}
                >
                  ● {selectedOrder.status}
                </span>

                <button
                  type="button"
                  className="btn-icon-action"
                  style={{
                    padding: 8,
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                  }}
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close dossier"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* 2. Dossier Body */}
            <div className="modal-body">
              {/* Layer 1: Visual Fulfillment Pipeline Progress Tracker */}
              <div className="dossier-pipeline-wrap">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1.2,
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    Fulfillment Pipeline Journey
                  </span>
                  {selectedOrder.status === 'Cancelled' ? (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#b91c1c',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      Order Revoked / Cancelled
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--forest)', fontWeight: 600 }}>
                      Stage {currentStageIdx + 1} of 4 Active
                    </span>
                  )}
                </div>

                {selectedOrder.status === 'Cancelled' ? (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      padding: 14,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#b91c1c',
                      fontSize: 13,
                    }}
                  >
                    <AlertCircle size={18} />
                    <span>This order was cancelled. You may restore it by changing the status below.</span>
                  </div>
                ) : (
                  <div className="dossier-stepper">
                    <div className="dossier-step-line">
                      <div
                        className="dossier-step-progress-fill"
                        style={{
                          width: `${
                            currentStageIdx <= 0
                              ? 0
                              : (currentStageIdx / (PIPELINE_STAGES.length - 1)) * 100
                          }%`,
                        }}
                      />
                    </div>

                    {PIPELINE_STAGES.map((stg, idx) => {
                      const IconComp = stg.icon;
                      const isCompleted = idx < currentStageIdx;
                      const isActive = idx === currentStageIdx;

                      return (
                        <div
                          key={stg.id}
                          className={`dossier-step-node ${
                            isCompleted ? 'completed' : isActive ? 'active' : ''
                          }`}
                        >
                          <div className="dossier-step-circle">
                            {isCompleted ? <Check size={16} /> : <IconComp size={16} />}
                          </div>
                          <div className="dossier-step-label">{stg.label}</div>
                          <div className="dossier-step-sub">{stg.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pipeline Controls & Quick Action Button */}
                <div className="dossier-actions-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500 }}>
                      Current Status:
                    </span>
                    <select
                      className="filter-select"
                      value={selectedOrder.status || 'Confirmed'}
                      disabled={updating}
                      onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                      style={{ background: '#ffffff', fontWeight: 600 }}
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Atelier Prep">Atelier Prep</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {nextStage && selectedOrder.status !== 'Cancelled' && (
                    <button
                      type="button"
                      className="dossier-quick-btn"
                      disabled={updating}
                      onClick={() => handleStatusChange(selectedOrder.id, nextStage.id)}
                    >
                      <span>{updating ? 'Updating...' : `Advance to ${nextStage.label}`}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Layer 2: Side-by-Side Logistics & Financial Register */}
              <div className="dossier-grid">
                {/* Logistics & Patron Card */}
                <div className="dossier-card">
                  <div className="dossier-card-head">
                    <div className="dossier-card-title">
                      <MapPin size={15} />
                      <span>Destination Logistics</span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        background: '#f3efe6',
                        border: '1px solid var(--border)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        color: 'var(--foreground)',
                      }}
                    >
                      Express Courier
                    </span>
                  </div>

                  <div className="dossier-card-body">
                    <div>
                      <div
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: 17,
                          fontWeight: 600,
                          color: 'var(--foreground)',
                        }}
                      >
                        {selectedOrder.address?.name || 'Valued Guest'}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--muted-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 3,
                        }}
                      >
                        <Mail size={12} />
                        <a
                          href={`mailto:${selectedOrder.address?.email}`}
                          style={{ color: 'var(--foreground)', textDecoration: 'none' }}
                        >
                          {selectedOrder.address?.email || 'No email provided'}
                        </a>
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#fbfaf7',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        padding: '10px 12px',
                        marginTop: 4,
                        lineHeight: 1.6,
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>
                        {selectedOrder.address?.street || 'Standard Address'}
                      </div>
                      <div style={{ color: 'var(--muted-foreground)' }}>
                        {selectedOrder.address?.city || 'City'}, PIN: {selectedOrder.address?.postal || 'N/A'}
                      </div>
                      <div style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>India</div>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
                      Patron Account:{' '}
                      <strong style={{ color: 'var(--foreground)' }}>
                        {selectedOrder.user_id ? `Verified (${selectedOrder.user_id.slice(0, 14)}...)` : 'Guest Checkout'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Financial & Settlement Card */}
                <div className="dossier-card">
                  <div className="dossier-card-head">
                    <div className="dossier-card-title">
                      <CreditCard size={15} />
                      <span>Commercial Register</span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--forest)',
                        background: '#edf5ed',
                        border: '1px solid #d4e7d4',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      ✓ SETTLED
                    </span>
                  </div>

                  <div className="dossier-card-body">
                    <div className="dossier-row-financial">
                      <span>Garments Subtotal</span>
                      <strong style={{ color: 'var(--foreground)' }}>{money(itemsSubtotal)}</strong>
                    </div>

                    <div className="dossier-row-financial">
                      <span>Atelier Express Dispatch</span>
                      <span style={{ color: 'var(--forest)', fontWeight: 600 }}>Complimentary</span>
                    </div>

                    <div className="dossier-row-financial">
                      <span>Goods & Services Tax (GST 12%)</span>
                      <span>Included ({money(estimatedGst)})</span>
                    </div>

                    <div className="dossier-row-total">
                      <div>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: 0.5 }}>
                          Total Amount Paid
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--forest)' }}>Payment Verified</div>
                      </div>
                      <div
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: 24,
                          fontWeight: 500,
                          color: 'var(--foreground)',
                        }}
                      >
                        {money(selectedOrder.total)}
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#faf8f5',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        padding: '8px 10px',
                        fontSize: 11,
                        color: 'var(--muted-foreground)',
                        marginTop: 4,
                      }}
                    >
                      Ref Code:{' '}
                      <span style={{ fontFamily: 'monospace', color: 'var(--foreground)' }}>
                        {selectedOrder.request_id || selectedOrder.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layer 3: Curated Garments Manifest */}
              <div className="dossier-card">
                <div className="dossier-card-head">
                  <div className="dossier-card-title">
                    <Package size={15} />
                    <span>Curated Pieces in Shipment ({orderItems.length})</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    {orderItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} Units Total
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {orderItems.map((item, idx) => {
                    const imgUrl = getProductImageUrl(item.image);
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.price) || 0;

                    return (
                      <div key={idx} className="dossier-item-row">
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className="dossier-item-img"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100';
                          }}
                        />

                        <div>
                          <div
                            style={{
                              fontFamily: 'Georgia, serif',
                              fontWeight: 500,
                              color: 'var(--foreground)',
                              fontSize: 16,
                            }}
                          >
                            {item.name}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginTop: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                background: '#f3efe6',
                                border: '1px solid var(--border)',
                                padding: '2px 8px',
                                borderRadius: 4,
                                color: 'var(--foreground)',
                                fontWeight: 600,
                              }}
                            >
                              Size: {item.size || 'M'}
                            </span>

                            <span
                              style={{
                                fontSize: 11,
                                background: '#ffffff',
                                border: '1px solid var(--border)',
                                padding: '2px 8px',
                                borderRadius: 4,
                                color: 'var(--muted-foreground)',
                              }}
                            >
                              Qty: {qty}
                            </span>

                            {item.productId && (
                              <span style={{ fontSize: 11, color: 'var(--subtle)' }}>
                                SKU: {item.productId}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: 'var(--subtle)' }}>
                            {qty} × {money(price)}
                          </div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: 'var(--foreground)',
                              fontSize: 16,
                              marginTop: 2,
                            }}
                          >
                            {money(price * qty)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Dossier Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn-icon-action"
                onClick={() => window.print()}
                title="Print Official Packing & Dispatch Slip"
              >
                <Printer size={15} />
                <span>Print Official Packing Slip</span>
              </button>

              <button
                type="button"
                className="btn-icon-action btn-primary-action"
                onClick={() => setSelectedOrder(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
          </div>,
          document.body
        )}
    </div>
  );
}
