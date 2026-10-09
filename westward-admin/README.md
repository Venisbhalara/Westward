# WESTWARD Atelier — Executive Admin Suite 🛡️

A dedicated, isolated, full-stack administrative platform for managing the WESTWARD luxury menswear ecosystem.

## 🚀 Quick Start

```bash
cd westward-admin
npm run dev
```

- **Admin Panel URL:** `http://localhost:5174`
- **Customer Storefront URL:** `http://localhost:5173`
- **🔐 Custom Security PIN:** Configure your own custom 6-digit access PIN in `.env` (`ADMIN_PIN=your_custom_pin`) as per your security preference.

---

## 💎 Features & Capabilities

1. **🔒 Executive PIN Security Gate:**
   - 6-digit tactile PIN authentication keypad with keyboard support.
   - Session-based authorization token protecting all administrative endpoints.
   - Quick one-click session lock / exit.

2. **📊 Real-time Dashboard & Analytics:**
   - Live Gross Revenue, Total Orders, Average Order Value.
   - Registered Customer Count from `westward_db.users`.
   - Concierge Support Ticket stats.
   - Real-time order fulfillment pipeline breakdown (`Confirmed`, `Atelier Prep`, `Dispatched`, `Delivered`, `Cancelled`).
   - Recent orders live feed.

3. **📦 Orders Fulfillment Dossier:**
   - Comprehensive orders table with instant search (Order ID, customer name, email, city).
   - Filter by fulfillment status.
   - Detailed Order Inspection Modal:
     - Full delivery destination address (Name, Street, City, PIN code, Email).
     - Individual pieces ordered (Images, Names, Sizes, Quantities, Unit Prices).
     - Live 1-click status update (`Confirmed` ➔ `Atelier Prep` ➔ `Dispatched` ➔ `Delivered` ➔ `Cancelled`) syncing directly to MongoDB.
     - Print Packing Slip / Invoice button.

4. **👥 Registered Customers Directory:**
   - Real-time sync with `westward_db.users`.
   - Customer name, email, registration date.
   - Total orders count and lifetime customer spend (INR).
   - VIP / Patron loyalty tier categorization.

5. **🧥 Catalog & Garment Inventory:**
   - Real-time catalog from `westward_db.products`.
   - Filter by category (`Shirts`, `Jackets`, `Denim`, `Trousers`, `Footwear`, etc.).
   - Add new products modal with direct MongoDB insert.
   - Edit retail prices and product details.
   - Delete product with confirmation.

6. **✉️ Customer Support & Concierge Inquiries:**
   - Inquiries from `westward_db.contact_inquiries`.
   - Ticket reader showing customer message and linked order reference.
   - Status update (`new` ➔ `in_progress` ➔ `resolved`).
   - Quick reply via email link.

---

## 🍃 Database Architecture

Directly connected to **MongoDB**:
- **Database:** `westward_db`
- **Connection URI:** `mongodb://127.0.0.1:27017/westward_db`
- **Collections Connected:** `orders`, `users`, `products`, `contact_inquiries`, `bag`, `wishlist`, `sessions`.
- **Visualization:** View all collections, documents, and real-time updates directly in **MongoDB Compass**.
