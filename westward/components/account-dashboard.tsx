'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Heart,
  ShoppingBag,
  LogOut,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Mail,
  User,
  Clock,
} from 'lucide-react';
import { Product } from '@/lib/catalog';

export type BagItem = { productId: string; size: string; quantity: number };
export type Order = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  address?: string | Record<string, string>;
  items: (BagItem & { name: string; price: number; image?: string })[];
};

interface AccountDashboardProps {
  user: { name: string; email: string };
  orders: Order[];
  wishlist: string[];
  products: Product[];
  bagCount: number;
  onLogout: () => Promise<void>;
  busy: boolean;
  onMutate: (body: Record<string, unknown>) => Promise<unknown>;
  onQuickAdd: (p: Product) => void;
  money: (n: number) => string;
}

export default function AccountDashboard({
  user,
  orders,
  wishlist,
  products,
  bagCount,
  onLogout,
  busy,
  onMutate,
  onQuickAdd,
  money,
}: AccountDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'details' | 'perks'>('orders');

  const initials = user.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'W';

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="account-dashboard-wrapper">
      {/* Layer 1: Elevated Profile Header Card */}
      <div className="account-hero-card">
        <div className="account-profile-main">
          <div className="account-avatar-ring">
            <div className="account-avatar-monogram">{initials}</div>
          </div>
          <div className="account-identity">
            <div className="account-badge-pill">
              <BadgeCheck size={14} />
              <span>WESTWARD Verified Member</span>
            </div>
            <h1 className="account-user-name">{user.name}</h1>
            <p className="account-user-email">
              <Mail size={14} />
              {user.email}
            </p>
          </div>
        </div>

        <div className="account-profile-actions">
          <Link href="/shop" className="button light account-shop-btn">
            Explore collection <ArrowUpRight size={15} />
          </Link>
          <button
            type="button"
            className="account-signout-btn"
            onClick={onLogout}
            disabled={busy}
            title="Sign out of your WESTWARD account"
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Layer 2: Quick Metrics Strip */}
      <div className="account-stats-row">
        <button
          type="button"
          className={`account-stat-card ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <div className="account-stat-icon-wrap">
            <Package size={20} />
          </div>
          <div className="account-stat-info">
            <span className="account-stat-num">{orders.length}</span>
            <span className="account-stat-title">Orders</span>
          </div>
          <span className="account-stat-caption">
            {orders.length === 1 ? '1 order placed' : `${orders.length} total orders`}
          </span>
        </button>

        <button
          type="button"
          className={`account-stat-card ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          <div className="account-stat-icon-wrap">
            <Heart size={20} />
          </div>
          <div className="account-stat-info">
            <span className="account-stat-num">{wishlist.length}</span>
            <span className="account-stat-title">Saved</span>
          </div>
          <span className="account-stat-caption">
            {wishlist.length === 1 ? '1 piece saved' : `${wishlist.length} saved pieces`}
          </span>
        </button>

        <Link href="/shop" className="account-stat-card">
          <div className="account-stat-icon-wrap">
            <ShoppingBag size={20} />
          </div>
          <div className="account-stat-info">
            <span className="account-stat-num">{bagCount}</span>
            <span className="account-stat-title">In Bag</span>
          </div>
          <span className="account-stat-caption">
            {bagCount === 0 ? 'Bag is empty' : `${bagCount} items ready`}
          </span>
        </Link>
      </div>

      {/* Layer 3: Segmented Section Tab Navigation */}
      <div className="account-nav-tabs" role="tablist" aria-label="Account sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'orders'}
          className={`account-nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Package size={16} />
          <span>Orders & History</span>
          <span className="tab-counter">{orders.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'wishlist'}
          className={`account-nav-tab ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          <Heart size={16} />
          <span>Saved Pieces</span>
          <span className="tab-counter">{wishlist.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'details'}
          className={`account-nav-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <User size={16} />
          <span>Account Profile</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'perks'}
          className={`account-nav-tab ${activeTab === 'perks' ? 'active' : ''}`}
          onClick={() => setActiveTab('perks')}
        >
          <ShieldCheck size={16} />
          <span>Benefits & Care</span>
        </button>
      </div>

      {/* Layer 4: Layered Content Sections */}
      <div className="account-tab-content">
        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div className="account-section-layer">
            <div className="account-section-header">
              <div>
                <h2>Order History</h2>
                <p className="account-section-desc">
                  Track your orders and view full item breakdowns.
                </p>
              </div>
              <span className="account-count-badge">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="account-empty-box">
                <Package className="account-empty-icon" size={44} />
                <h3>No orders placed yet</h3>
                <p>
                  Explore our modern menswear collection and place your order.
                  All orders will be saved directly to your account.
                </p>
                <Link href="/shop" className="button">
                  Discover the collection <ArrowUpRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="account-orders-list">
                {orders.map((o) => {
                  let parsedAddress: Record<string, string> | null = null;
                  if (o.address) {
                    if (typeof o.address === 'object') {
                      parsedAddress = o.address as Record<string, string>;
                    } else {
                      try {
                        parsedAddress = JSON.parse(o.address);
                      } catch {
                        // ignore
                      }
                    }
                  }

                  const statusNorm = o.status === 'Demo — not charged' ? 'Confirmed' : (o.status || 'Confirmed');
                  const isDelivered = statusNorm === 'Delivered';
                  const isDispatched = statusNorm === 'Dispatched' || isDelivered;
                  const isPrep = statusNorm === 'Atelier Prep' || isDispatched;
                  const isConfirmed = statusNorm === 'Confirmed' || isPrep;
                  const isCancelled = statusNorm === 'Cancelled';
                  const badgeClass = statusNorm.toLowerCase().replace(/\s+/g, '-');

                  return (
                    <article className="layered-order-card" key={o.id}>
                      {/* Order Card Header */}
                      <div className="order-card-header">
                        <div className="order-primary-info">
                          <span className="order-id-label">ORDER</span>
                          <span className="order-id-value">{o.id}</span>
                          <span className="order-date-pill">
                            <Calendar size={13} />
                            {new Date(o.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="order-status-group">
                          <span className={`order-status-badge ${badgeClass}`}>
                            {isDelivered ? (
                              <>
                                <ShieldCheck size={13} />
                                <span>Delivered</span>
                              </>
                            ) : isDispatched ? (
                              <>
                                <Truck size={13} />
                                <span>Dispatched</span>
                              </>
                            ) : statusNorm === 'Atelier Prep' ? (
                              <>
                                <Package size={13} />
                                <span>Atelier Prep</span>
                              </>
                            ) : isCancelled ? (
                              <>
                                <RotateCcw size={13} />
                                <span>Cancelled</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Confirmed</span>
                              </>
                            )}
                          </span>
                          <span className="order-price-total">{money(o.total)}</span>
                        </div>
                      </div>

                      {/* Delivery Status Timeline Bar */}
                      <div className="order-timeline-bar">
                        <div className={`timeline-step ${isConfirmed && !isCancelled ? 'done' : ''}`}>
                          <span className="timeline-dot" />
                          <span className="timeline-text">Placed</span>
                        </div>
                        <div className={`timeline-connector ${isConfirmed && !isCancelled ? 'done' : ''}`} />
                        <div className={`timeline-step ${isConfirmed && !isCancelled ? 'done' : ''}`}>
                          <span className="timeline-dot" />
                          <span className="timeline-text">{statusNorm === 'Atelier Prep' ? 'Atelier Prep' : 'Confirmed'}</span>
                        </div>
                        <div className={`timeline-connector ${isDispatched && !isCancelled ? 'done' : ''}`} />
                        <div className={`timeline-step ${isDispatched && !isCancelled ? 'done' : ''}`}>
                          <span className="timeline-dot" />
                          <span className="timeline-text">Dispatched</span>
                        </div>
                        <div className={`timeline-connector ${isDelivered && !isCancelled ? 'done' : ''}`} />
                        <div className={`timeline-step ${isDelivered && !isCancelled ? 'done' : ''}`}>
                          <span className="timeline-dot" />
                          <span className="timeline-text">Delivered</span>
                        </div>
                      </div>

                      {/* Order Items Table / Cards */}
                      <div className="order-items-grid">
                        {o.items.map((i, index) => (
                          <div className="order-item-card" key={index}>
                            <Link href={`/product/${i.productId}`} className="order-item-thumb-link">
                              <img
                                src={`/images/${i.image || '6838911'}.jpg`}
                                alt={i.name}
                                className="order-item-img"
                              />
                            </Link>
                            <div className="order-item-details">
                              <Link href={`/product/${i.productId}`} className="order-item-name">
                                {i.name}
                              </Link>
                              <div className="order-item-specs">
                                <span className="spec-tag">Size: {i.size}</span>
                                <span className="spec-tag">Qty: {i.quantity}</span>
                              </div>
                              <span className="order-item-price">
                                {money(i.price * i.quantity)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Card Footer */}
                      <div className="order-card-footer">
                        <div className="order-delivery-meta">
                          {isDelivered ? (
                            <>
                              <ShieldCheck size={15} style={{ color: '#2f5233' }} />
                              <span style={{ color: '#2f5233', fontWeight: 600 }}>
                                Delivered to destination
                                {parsedAddress?.city ? ` in ${parsedAddress.city}, PIN ${parsedAddress.postal}` : ''}
                              </span>
                            </>
                          ) : isDispatched ? (
                            <>
                              <Truck size={15} style={{ color: '#1d4ed8' }} />
                              <span style={{ color: '#1d4ed8', fontWeight: 600 }}>
                                In courier transit to {parsedAddress?.city || 'destination'}
                              </span>
                            </>
                          ) : statusNorm === 'Atelier Prep' ? (
                            <>
                              <Package size={15} style={{ color: '#a16207' }} />
                              <span style={{ color: '#a16207', fontWeight: 600 }}>
                                Handcrafted & packaged in atelier
                              </span>
                            </>
                          ) : isCancelled ? (
                            <>
                              <RotateCcw size={15} style={{ color: '#b91c1c' }} />
                              <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                                Order cancelled
                              </span>
                            </>
                          ) : (
                            <>
                              <Truck size={15} />
                              <span>
                                Standard Delivery (3–7 business days)
                                {parsedAddress?.city ? ` to ${parsedAddress.city}, PIN ${parsedAddress.postal}` : ''}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="order-taxes-note">Inclusive of all applicable taxes</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved Pieces */}
        {activeTab === 'wishlist' && (
          <div className="account-section-layer">
            <div className="account-section-header">
              <div>
                <h2>Saved for Later</h2>
                <p className="account-section-desc">
                  Pieces you have bookmarked to revisit anytime.
                </p>
              </div>
              <span className="account-count-badge">
                {savedProducts.length} {savedProducts.length === 1 ? 'Piece' : 'Pieces'}
              </span>
            </div>

            {savedProducts.length === 0 ? (
              <div className="account-empty-box">
                <Heart className="account-empty-icon" size={44} />
                <h3>Your saved pieces are empty</h3>
                <p>Tap the heart icon on any piece across the collection to save it here.</p>
                <Link href="/shop" className="button">
                  Explore pieces <ArrowUpRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="product-grid">
                {savedProducts.map((p) => (
                  <article className="product-card" key={p.id}>
                    <div className="product-photo">
                      <Link href={`/product/${p.id}`}>
                        <img
                          src={`/images/${p.image}.jpg`}
                          alt={`${p.name} in ${p.color}`}
                          loading="lazy"
                        />
                      </Link>
                      <span className="product-tag">{p.tag}</span>
                      <button
                        type="button"
                        aria-label={`Unsave ${p.name}`}
                        className="heart active"
                        disabled={busy}
                        onClick={() =>
                          onMutate({ action: 'wishlist', productId: p.id, saved: false })
                        }
                      >
                        <Heart fill="currentColor" />
                      </button>
                      <button
                        type="button"
                        className="quick-add"
                        onClick={() => onQuickAdd(p)}
                      >
                        Choose size <Plus size={16} />
                      </button>
                    </div>
                    <div className="product-title">
                      <Link href={`/product/${p.id}`}>{p.name}</Link>
                      <span>{money(p.price)}</span>
                    </div>
                    <p className="product-color">{p.color}</p>
                    <div className="swatches">
                      <span style={{ background: p.hex }} />
                      <small>{p.color}</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Account Profile Details */}
        {activeTab === 'details' && (
          <div className="account-section-layer">
            <div className="account-section-header">
              <div>
                <h2>Account Profile</h2>
                <p className="account-section-desc">
                  Your registered details, session preferences, and security.
                </p>
              </div>
            </div>

            <div className="account-details-grid">
              <div className="account-detail-card">
                <div className="detail-card-header">
                  <User size={18} />
                  <h3>Personal Information</h3>
                </div>
                <div className="detail-card-rows">
                  <div className="detail-row">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-val">{user.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-val">{user.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Membership Status</span>
                    <span className="detail-val highlight">Active Customer</span>
                  </div>
                </div>
              </div>

              <div className="account-detail-card">
                <div className="detail-card-header">
                  <ShieldCheck size={18} />
                  <h3>Security & Authentication</h3>
                </div>
                <div className="detail-card-rows">
                  <div className="detail-row">
                    <span className="detail-label">Password Protection</span>
                    <span className="detail-val">Active (Salted SHA-256)</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Session Status</span>
                    <span className="detail-val highlight">Secure Cookie Active</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Default Region</span>
                    <span className="detail-val">India (INR ₹)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Benefits & Perks */}
        {activeTab === 'perks' && (
          <div className="account-section-layer">
            <div className="account-section-header">
              <div>
                <h2>Member Benefits & Services</h2>
                <p className="account-section-desc">
                  Perks included with your WESTWARD customer account.
                </p>
              </div>
            </div>

            <div className="account-perks-grid">
              <div className="account-perk-card">
                <div className="perk-icon-wrap">
                  <Truck size={24} />
                </div>
                <h3>Complimentary Delivery</h3>
                <p>Enjoy free standard delivery across India on every order above ₹7,500.</p>
              </div>

              <div className="account-perk-card">
                <div className="perk-icon-wrap">
                  <RotateCcw size={24} />
                </div>
                <h3>14-Day Returns</h3>
                <p>Easy returns and exchanges on all unworn items with original garment tags.</p>
              </div>

              <div className="account-perk-card">
                <div className="perk-icon-wrap">
                  <Clock size={24} />
                </div>
                <h3>Real-Time Tracking</h3>
                <p>Instant order confirmations and order history saved permanently across visits.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
