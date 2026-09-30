'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Scissors,
  Loader2,
  FileText,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContactCareProps {
  user?: { name: string; email: string } | null;
  orders?: { id: string; total: number; createdAt: string }[];
}

interface SubmittedInquiry {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  message: string;
}

export default function ContactCare({ user, orders = [] }: ContactCareProps) {
  const [customName, setCustomName] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState<string | null>(null);
  const name = customName !== null ? customName : (user?.name || '');
  const email = customEmail !== null ? customEmail : (user?.email || '');
  const setName = setCustomName;
  const setEmail = setCustomEmail;
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Garment Care & Fabric Advice');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; message: string; date: string } | null>(null);
  const [pastInquiries, setPastInquiries] = useState<SubmittedInquiry[]>([]);
  const [activeCareTab, setActiveCareTab] = useState<'all' | 'denim' | 'linen' | 'outerwear' | 'leather'>('all');

  // Fetch past inquiries if authenticated
  useEffect(() => {
    if (!user) return;
    fetch('/api/contact')
      .then((res) => (res.ok ? (res.json() as Promise<{ inquiries?: SubmittedInquiry[] }>) : null))
      .then((data) => {
        if (data?.inquiries) {
          setPastInquiries(data.inquiries);
        }
      })
      .catch(() => {});
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error('Please enter your name (at least 2 characters).');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      toast.error('Please provide a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          subject,
          orderId: orderId.trim() || undefined,
          message: message.trim(),
        }),
      });

      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string; message?: string; createdAt?: string };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit inquiry.');
      }

      toast.success('Inquiry received! Our concierge team has been notified.');
      setSubmittedTicket({
        id: data.id || 'INQ-SUCCESS',
        message: data.message || 'Your inquiry has been stored in our system.',
        date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      });

      // Clear message field
      setMessage('');
      setPhone('');

      // Refresh past inquiries
      if (user) {
        fetch('/api/contact')
          .then((r) => (r.ok ? (r.json() as Promise<{ inquiries?: SubmittedInquiry[] }>) : null))
          .then((d) => d?.inquiries && setPastInquiries(d.inquiries))
          .catch(() => {});
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="contact-care-container">
      {/* Hero Section */}
      <section className="contact-hero-banner">
        <p className="eyebrow">WESTWARD CONCIERGE & ATELIER</p>
        <h1>Contact & Garment Care</h1>
        <p className="contact-hero-sub">
          Dedicated personal support for inquiries, sizing consultations, and the thoughtful preservation of your wardrobe.
        </p>
      </section>

      {/* Main 2-Column Split */}
      <div className="contact-main-grid">
        {/* Left Column: Inquiry Submission */}
        <div className="contact-form-card">
          <div className="card-header-styled">
            <MessageSquare className="header-icon" size={20} />
            <div>
              <h2>Send an Inquiry</h2>
              <p>Our concierge at the Mumbai Studio will reply within 24 business hours.</p>
            </div>
          </div>

          {submittedTicket ? (
            <div className="inquiry-success-view">
              <div className="success-badge-ring">
                <CheckCircle2 size={36} />
              </div>
              <h3>Inquiry Successfully Registered</h3>
              <div className="inquiry-ticket-box">
                <span className="ticket-label">REFERENCE TICKET</span>
                <span className="ticket-id">{submittedTicket.id}</span>
                <span className="ticket-timestamp">{submittedTicket.date}</span>
              </div>
              <p className="success-explainer">
                Your message has been permanently stored in our concierge database. We have linked this reference to your contact details and will respond via email shortly.
              </p>
              <button
                type="button"
                className="button light"
                onClick={() => setSubmittedTicket(null)}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="concierge-form" noValidate>
              <div className="form-fields-grid">
                <div className="contact-field">
                  <label htmlFor="contact-name">Your full name</label>
                  <div className="field-input-wrap">
                    <User size={16} className="field-icon" />
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="e.g. Samuel Bennett"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-email">Email address</label>
                  <div className="field-input-wrap">
                    <Mail size={16} className="field-icon" />
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-phone">Phone number <span className="subtle-tag">(Optional)</span></label>
                  <div className="field-input-wrap">
                    <Phone size={16} className="field-icon" />
                    <input
                      id="contact-phone"
                      type="tel"
                      placeholder="+91 98200 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-subject">Inquiry topic</label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="styled-select"
                    disabled={submitting}
                  >
                    <option value="Garment Care & Fabric Advice">Garment Care & Fabric Advice</option>
                    <option value="Order Status & Delivery Inquiry">Order Status & Delivery Inquiry</option>
                    <option value="Sizing & Fit Consultation">Sizing & Fit Consultation</option>
                    <option value="Returns & Exchanges Assistance">Returns & Exchanges Assistance</option>
                    <option value="Studio Atelier Appointment">Studio Atelier Appointment (Mumbai)</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                {orders.length > 0 && (
                  <div className="contact-field full">
                    <label htmlFor="contact-order">Link to a recent order <span className="subtle-tag">(Optional)</span></label>
                    <select
                      id="contact-order"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="styled-select"
                      disabled={submitting}
                    >
                      <option value="">No specific order</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.id} — Placed {new Date(o.createdAt).toLocaleDateString('en-IN')} (₹{o.total.toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="contact-field full">
                  <div className="label-with-counter">
                    <label htmlFor="contact-message">How can our concierge assist you?</label>
                    <span className="char-count">{message.length}/3000</span>
                  </div>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Describe your question regarding styling, garment care, or an existing piece in detail…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={3000}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="button full-button concierge-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="btn-loading-state">
                    <Loader2 className="animate-spin" size={17} />
                    Submitting inquiry…
                  </span>
                ) : (
                  <>
                    <span>Submit inquiry to concierge</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Past Inquiries Accordion if user is authenticated */}
          {user && pastInquiries.length > 0 && (
            <div className="past-inquiries-block">
              <div className="past-inquiries-title">
                <FileText size={16} />
                <h3>Your Previous Inquiries ({pastInquiries.length})</h3>
              </div>
              <div className="past-inquiries-list">
                {pastInquiries.map((inq) => (
                  <div className="inquiry-history-item" key={inq.id}>
                    <div className="inquiry-item-top">
                      <b>{inq.subject}</b>
                      <span className="inquiry-status-pill">{inq.status}</span>
                    </div>
                    <p className="inquiry-snippet">{inq.message}</p>
                    <span className="inquiry-meta">
                      Ref: {inq.id} · {new Date(inq.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Studio, Direct Channels & Care Commitments */}
        <div className="contact-sidebar">
          {/* Studio Atelier Card */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <MapPin size={18} />
              <h3>The Mumbai Studio & Atelier</h3>
            </div>
            <p className="studio-address">
              WESTWARD Atelier & Showroom<br />
              14 Heritage Lane, Kala Ghoda Arts District<br />
              Fort, Mumbai, Maharashtra 400001
            </p>
            <div className="studio-hours">
              <Clock size={15} />
              <span>Monday – Saturday: 10:00 AM – 7:00 PM IST</span>
            </div>
            <div className="studio-note">
              Appointments for private fittings or bespoke adjustments may be scheduled via the concierge form.
            </div>
          </div>

          {/* Direct Communication Channels */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <Phone size={18} />
              <h3>Direct Concierge Lines</h3>
            </div>
            <ul className="direct-channels-list">
              <li>
                <span className="channel-label">Concierge Email</span>
                <a href="mailto:concierge@westward.in" className="channel-link">
                  concierge@westward.in
                </a>
              </li>
              <li>
                <span className="channel-label">Telephone Studio Desk</span>
                <a href="tel:+912222849000" className="channel-link">
                  +91 (022) 2284-9000
                </a>
              </li>
              <li>
                <span className="channel-label">WhatsApp Priority Care</span>
                <a href="https://wa.me/919820045678" target="_blank" rel="noopener noreferrer" className="channel-link">
                  +91 98200 45678
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Guarantees Card */}
          <div className="sidebar-card highlight">
            <div className="sidebar-card-header">
              <ShieldCheck size={18} />
              <h3>The Westward Standard</h3>
            </div>
            <div className="guarantee-item">
              <Truck size={17} />
              <div>
                <b>Complimentary Shipping</b>
                <p>Express courier across India on all orders over ₹7,500.</p>
              </div>
            </div>
            <div className="guarantee-item">
              <RotateCcw size={17} />
              <div>
                <b>14-Day Honest Returns</b>
                <p>Simple returns on unworn pieces with tags attached.</p>
              </div>
            </div>
            <div className="guarantee-item">
              <Scissors size={17} />
              <div>
                <b>Lifetime Garment Care Consultation</b>
                <p>Expert advice on aging selvedge denim and conditioning leather pieces.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Garment Care Hub */}
      <section className="garment-care-hub">
        <div className="care-hub-header">
          <p className="eyebrow">ARTISANAL PRESERVATION</p>
          <h2>The Garment Care Guide</h2>
          <p className="care-hub-sub">
            WESTWARD garments are crafted from natural slub cotton, Japanese selvedge denim, pure washed linen, and full-grain leathers. Follow these principles to allow each piece to age gracefully.
          </p>

          <div className="care-category-filters" role="tablist">
            {(
              [
                ['all', 'All Garments'],
                ['denim', 'Selvedge Denim'],
                ['linen', 'Washed Linen & Cotton'],
                ['outerwear', 'Waxed & Lined Outerwear'],
                ['leather', 'Leather & Footwear'],
              ] as const
            ).map(([key, label]) => (
              <button
                type="button"
                role="tab"
                key={key}
                className={`care-filter-btn ${activeCareTab === key ? 'active' : ''}`}
                onClick={() => setActiveCareTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="care-cards-grid">
          {(activeCareTab === 'all' || activeCareTab === 'denim') && (
            <article className="care-guide-card">
              <div className="care-card-top">
                <span className="care-tag">DENIM</span>
                <Sparkles size={16} />
              </div>
              <h3>Selvedge & Raw Denim</h3>
              <p className="care-description">
                Raw and rinse-washed denim softens and molds to your stride. Wash sparingly to let distinct whiskering and honeycombs develop naturally.
              </p>
              <ul className="care-dos-list">
                <li><b>First 30 Wears:</b> Spot clean small stains with a damp cloth; hang outdoors in shaded fresh air to refresh.</li>
                <li><b>Washing:</b> Turn jeans inside out. Wash in cold water (below 30°C) with a mild, bleach-free detergent on gentle cycle.</li>
                <li><b>Drying:</b> Never tumble dry. Hang dry by the hem in shade to preserve crisp vertical tension and indigo saturation.</li>
              </ul>
            </article>
          )}

          {(activeCareTab === 'all' || activeCareTab === 'linen') && (
            <article className="care-guide-card">
              <div className="care-card-top">
                <span className="care-tag">SHIRTING & TEES</span>
                <Scissors size={16} />
              </div>
              <h3>Washed Linen & Slub Cottons</h3>
              <p className="care-description">
                Our linen and organic cotton shirting are pre-washed for immediate softness and an easy, lived-in roll.
              </p>
              <ul className="care-dos-list">
                <li><b>Machine Washing:</b> Wash with like colours in cool water. Avoid optical brighteners or harsh chemical bleaches.</li>
                <li><b>Drying & Ironing:</b> Hang dry immediately after the cycle. For an effortless western look, wear with natural texture; for formal occasions, steam iron while slightly damp.</li>
                <li><b>Storage:</b> Hang on wide wooden or contoured hangers to protect collar shape and shoulder drape.</li>
              </ul>
            </article>
          )}

          {(activeCareTab === 'all' || activeCareTab === 'outerwear') && (
            <article className="care-guide-card">
              <div className="care-card-top">
                <span className="care-tag">OUTERWEAR</span>
                <ShieldCheck size={16} />
              </div>
              <h3>Waxed Canvas & Wool Overshirts</h3>
              <p className="care-description">
                Heavyweight outer layers are engineered to withstand rain, dust, and wind for years of rugged utility.
              </p>
              <ul className="care-dos-list">
                <li><b>Waxed Cotton:</b> Do not machine wash or dry clean. Brush off dried mud with a horsehair brush; sponge with cold water.</li>
                <li><b>Re-Waxing:</b> Apply a light coat of natural beeswax dressing once every 12–18 months to replenish water resistance.</li>
                <li><b>Wool Blends & Coats:</b> Specialist dry clean once per season. Brush periodically with a clothes brush after long journeys.</li>
              </ul>
            </article>
          )}

          {(activeCareTab === 'all' || activeCareTab === 'leather') && (
            <article className="care-guide-card">
              <div className="care-card-top">
                <span className="care-tag">LEATHER & FOOTWEAR</span>
                <Sparkles size={16} />
              </div>
              <h3>Full-Grain Leather & Suede</h3>
              <p className="care-description">
                Hand-finished boots and leather accessories reward disciplined conditioning with a deep, lustrous patina.
              </p>
              <ul className="care-dos-list">
                <li><b>Smooth Leather:</b> Condition twice a year with a natural beeswax or mink oil balm; buff with a horsehair brush.</li>
                <li><b>Suede & Roughout:</b> Use a brass or crepe suede brush in one direction to restore nap and lift dirt. Avoid liquid conditioners.</li>
                <li><b>Boot Trees:</b> Insert cedar shoe trees immediately after wear to absorb moisture and preserve toe-spring posture.</li>
              </ul>
            </article>
          )}
        </div>
      </section>

      {/* Frequently Asked Questions Accordion */}
      <section className="contact-faq-section">
        <div className="faq-section-header">
          <p className="eyebrow">COMMON QUERIES</p>
          <h2>Frequently Asked Questions</h2>
        </div>
        <div className="faq-grid">
          <details className="faq-card">
            <summary>How long does domestic shipping take within India?</summary>
            <p>
              Orders are packaged and dispatched from our Mumbai facility within 24–48 business hours. Delivery typically takes 3–5 business days to metro cities (Mumbai, Delhi NCR, Bengaluru, Chennai, Kolkata, Hyderabad) and 5–7 business days to regional locations. Complimentary shipping is provided on all orders exceeding ₹7,500.
            </p>
          </details>

          <details className="faq-card">
            <summary>What is your returns and exchange policy?</summary>
            <p>
              We welcome returns and exchanges on unworn, unwashed pieces in their original state with tags intact within 14 days of receipt. Once received and inspected at our studio, refunds are processed back to the original method or store credit.
            </p>
          </details>

          <details className="faq-card">
            <summary>Can I schedule a private fitting at the Kala Ghoda Atelier?</summary>
            <p>
              Yes. We welcome private appointments for bespoke styling, sizing evaluations, or trouser hemming at our Fort atelier in Mumbai. Select &quot;Studio Atelier Appointment&quot; in the form above with your preferred date, and our concierge will confirm your reservation.
            </p>
          </details>

          <details className="faq-card">
            <summary>Do you offer complimentary alterations on trousers and denim?</summary>
            <p>
              All WESTWARD selvedge denim and tailored trousers are eligible for complimentary chainstitch hemming within 30 days of purchase upon presentation of your order confirmation.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
