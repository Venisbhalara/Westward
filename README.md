# WESTWARD ATELIER
> **INDEPENDENT SPIRIT. CONSIDERED STYLE.**

A luxury menswear e-commerce platform and real-time executive administration suite, crafted with Georgia serif typography, warm ivory palette, and direct MySQL synchronization.

---

## Architecture Overview

```
WESTWARD-Complete-Project/
├── westward/              # Main Customer E-Commerce Storefront (Next.js / Vite, Port 5173)
│   ├── app/               # Storefront pages (Shop, Product, Account, Checkout, Contact)
│   ├── components/        # Store components (AccountDashboard, AuthCard, ContactCare)
│   ├── lib/               # Catalog, Auth, and MySQL Client Connector
│   └── public/            # Curated product photography & assets
│
└── westward admin/        # Executive Administration Panel (Express + Vite React, Port 5174)
    ├── src/               # Admin UI (Dashboard, Orders, Customers, Catalog, Inquiries)
    ├── server.mjs         # Express backend with Strict Middleware & Brute-Force Lockout
    └── db.mjs             # Dedicated MySQL Connection Pool
```

---

## Key Features

### 🛍️ Customer Storefront (`/westward`)
- **100 Curated Pieces**: Shirts, jackets, denim, footwear, knitwear, and accessories.
- **Dynamic Customer Account**: Real-time order fulfillment pipeline tracker, saved pieces, loyalty perks.
- **Real-Time Sync**: Instantaneous order status reflection without page refresh.
- **Bespoke Checkout**: Responsive delivery destination address collection and order receipt generator.

### 🛡️ Executive Admin Panel (`/westward admin`)
- **Strict Security Middleware**: Every administrative endpoint (`/api/*`) is protected with multi-token authentication (`HttpOnly` cookie, `x-admin-token`, `Bearer`).
- **Encrypted PIN Screen**: 6-digit keypad with brute-force rate-limiting (locks for 60 seconds after 5 failed attempts).
- **Atelier Fulfillment Dossier**: Layered modal with interactive 4-stage pipeline stepper (`Confirmed` ➔ `Atelier Prep` ➔ `Dispatched` ➔ `Delivered`), destination logistics, financial breakdown, and 1-click status advancement.
- **Printable Invoices**: Clean `@media print` packing slip generator.
- **Realtime MySQL Synchronization**: Live status changes instantly update customer account dashboards.

---

## Quick Start & Setup

### Prerequisites
- **Node.js** (v18+ or v20+)
- **MySQL Server** (Running on `127.0.0.1:3306` with database `westward_db`)

### 1. Database Setup
Create database `westward_db` in MySQL:
```sql
CREATE DATABASE IF NOT EXISTS westward_db;
```

### 2. Run Main Customer Storefront
```bash
cd westward
npm install
npm run dev
```
Storefront opens at: **http://localhost:5173**

### 3. Run Executive Admin Panel
```bash
cd "westward admin"
npm install
node server.mjs
```
Admin Panel opens at: **http://localhost:5174**

- **Default Admin PIN**: `123456` (Configurable in `.env`)

---

## Technologies Used
- **Frontend**: React 19, Next.js, Vite, Tailwind CSS, Lucide Icons
- **Backend & Database**: Express.js, MySQL 2 (`disableEval: true`), Cloudflare D1/Wrangler
- **Styling**: Georgia serif luxury editorial design, ivory linen background (`#f8f6f1`), deep charcoal (`#292720`), forest green highlights (`#2f5233`)

---

## License & Credits
Crafted with passion for **WESTWARD ATELIER** by **Venis Bhalara**.
All rights reserved.
