<div align="center">

# W E S T W A R D
### ATELIER OF DISTINCTION &bull; LUXURY MENSWEAR

*Independent Spirit. Considered Style. Realtime Engineering.*

<br />

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-Backend-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

<br />

> **"A digital atelier where haute horlogerie and bespoke sartorial tailoring meet contemporary full-stack precision."**

---

</div>

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
  - [Customer Storefront (`/westward`)](#1-customer-storefront-westward)
  - [Executive Admin Suite (`/westward-admin`)](#2-executive-admin-suite-westward-admin)
- [🔐 Admin Security & Custom PIN Setup](#-admin-security--custom-pin-setup)
- [Database Architecture](#-database-architecture)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Database Setup](#1-database-setup)
  - [2. Customer Storefront](#2-customer-storefront)
  - [3. Executive Admin Suite](#3-executive-admin-suite)
- [Design Philosophy & Aesthetic Tokens](#-design-philosophy--aesthetic-tokens)
- [Credits & Author](#-credits--author)

---

## 🏛️ Overview

**WESTWARD** is an end-to-end luxury menswear digital ecosystem engineered for discerning fashion houses. Built with editorial Georgia serif typography, warm ivory linen textures, and an architectural color scheme, the platform delivers an immersive customer shopping journey backed by an isolated, high-security executive control center.

Every order placed on the customer storefront seamlessly registers into **MySQL Workbench** and streams in real time to the **Executive Administration Suite**, allowing administrators to fulfill, inspect, and update orders with immediate live reflection on customer dashboards.

---

## 🏗️ System Architecture

```text
WESTWARD-Complete-Project/
│
├── 🛍️ westward/                       # Customer Storefront (Port 5173)
│   ├── app/                          # Next.js / React 19 Editorial Store Pages
│   │   ├── account/                  # Real-Time Order Tracking & Customer Profile
│   │   ├── bag/                      # Interactive Shopping Bag & Line Item Pricing
│   │   ├── checkout/                 # Bespoke Multi-Step Delivery & Payment Flow
│   │   ├── collection/               # Catalog Filtering (Shirts, Tailoring, Denim)
│   │   └── product/[handle]/         # Immersive Product Display Pages
│   ├── components/                   # Curated Component Library
│   ├── lib/                          # Database Connectors & Catalog Services
│   └── public/                       # High-Resolution Atelier Imagery
│
└── 🛡️ westward-admin/                 # Executive Administration Suite (Port 5174)
    ├── src/                          # Reactive Executive Dashboard UI (Vite + React)
    │   ├── components/               # Tactile Keypad, Metrics Cards, Order Table
    │   └── InspectModal.jsx          # Layered Atelier Fulfillment & Dossier Inspector
    ├── server.mjs                    # Hardened Express Backend & Security Middleware
    └── db.mjs                        # Dedicated Connection Pooling for MySQL
```

---

## ✨ Key Features

### 1. Customer Storefront (`/westward`)
- **100 Curated Garments**: Handcrafted collections spanning Italian linen shirts, selvedge denim, structured trench coats, merino knitwear, and leather footwear.
- **Dynamic Real-Time Account Dashboard**: Customers experience continuous live synchronization with MySQL — order status progression reflects instantly without needing page refreshes.
- **Interactive Fulfillment Pipeline**: Visual 4-stage tracking timeline (`Confirmed` &bull; `Atelier Prep` &bull; `Dispatched` &bull; `Delivered`).
- **Precision Address Capture**: Clean, responsive shipping destination form writing directly to relational database tables.
- **Persistent Wishlist & Bag**: Instant local and cloud-synchronized state management for saved items.

### 2. Executive Admin Suite (`/westward-admin`)
- **Isolated Administration Environment**: Completely separate folder structure and port isolation ensuring zero customer leakage.
- **Multi-Layered Security Middleware**: Protected administrative endpoints guarded by encrypted cookies and authorization tokens with automated rate-limiting.
- **Tactile PIN Authentication Gate**: 6-digit access keypad with brute-force lockout safeguards.
- **Atelier Fulfillment Dossier (Inspect Modal)**:
  - Deep inspection of customer shipping details, contact information, and order notes.
  - Granular breakdown of individual garments, sizes, quantities, and pricing.
  - Interactive 1-click status transitions synced straight to MySQL.
  - Printable **Packing Slip / Invoice** generation via `@media print`.
- **Live Business Intelligence**: Real-time Gross Revenue, Order Velocity, Average Order Value (AOV), and Active Customer tallies.

---

## 🔐 Admin Security & Custom PIN Setup

The Executive Admin Suite is fortified with customizable, private credential management. Rather than relying on rigid defaults, **administrators have complete control to set their own secure PIN according to their preference.**

### How to Configure Your Custom Admin PIN:

1. Navigate to the `westward-admin` directory:
   ```bash
   cd westward-admin
   ```

2. Open your `.env` configuration file (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Set your preferred secret 6-digit access PIN:
   ```env
   # Set any custom 6-digit PIN as per your security requirement
   ADMIN_PIN=852963
   ```

4. Save the file and start the admin server. The keypad screen will immediately authenticate against your customized security PIN!

---

## 🗄️ Database Architecture

WESTWARD utilizes a structured relational database schema hosted on **MySQL 8.0**:

| Table Name | Description | Key Attributes |
|:---|:---|:---|
| `users` | Registered client profiles & authentication | `id`, `name`, `email`, `role`, `created_at` |
| `addresses` | Saved customer delivery destinations | `id`, `user_id`, `street`, `city`, `postal_code`, `phone` |
| `orders` | Master orders ledger with financial breakdown | `id`, `user_id`, `status`, `total_amount`, `created_at` |
| `order_items` | Individual line items & garment specifications | `id`, `order_id`, `product_id`, `title`, `size`, `quantity`, `price` |
| `products` | Atelier catalog pieces & stock management | `id`, `title`, `handle`, `price`, `category`, `image` |
| `contact_inquiries` | Bespoke customer care tickets | `id`, `name`, `email`, `message`, `status`, `created_at` |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MySQL Server** (Running locally on `127.0.0.1:3306`)

### 1. Database Setup
Launch MySQL Workbench or your preferred database GUI, and create the database:
```sql
CREATE DATABASE IF NOT EXISTS westward_db;
```
*(The schema and required relational tables will automatically initialize on the first application launch.)*

### 2. Customer Storefront
In your terminal, launch the storefront:
```bash
cd westward
npm install
npm run dev
```
🌐 **Storefront URL:** [`http://localhost:5173`](http://localhost:5173)

### 3. Executive Admin Suite
In a separate terminal, launch the executive management portal:
```bash
cd westward-admin
npm install
node server.mjs
```
🛡️ **Admin Suite URL:** [`http://localhost:5174`](http://localhost:5174)

---

## 🎨 Design Philosophy & Aesthetic Tokens

The WESTWARD visual language is inspired by European sartorial heritage and high-end editorial publications:

<div align="center">

| Token | Hex Value | Application |
|:---|:---|:---|
| **Linen Ivory** | `#F8F6F1` | Primary editorial background, evoking natural bespoke fabrics |
| **Warm Sand** | `#F3EFE6` | Surface cards, elevated containers, input borders |
| **Deep Charcoal** | `#292720` | Primary typographic tone for commanding contrast |
| **Atelier Forest** | `#2F5233` | Verified status badges, delivery confirmations, accents |
| **Warm Gold** | `#C5A059` | VIP tier accents, active pipeline steps, royal emblems |

</div>

- **Typography**: Editorial Georgia serif paired with Cormorant Garamond for regal headings, complemented by clean geometric sans-serif for numbers and metadata.
- **Motion**: Subtle CSS transitions, micro-elevations, tactile keypad feedback, and smooth state morphs.

---

## 👤 Credits & Author

Crafted with passion, dedication, and uncompromising attention to detail by:

**Venis Bhalara**  
*Full Stack Engineer & Creative Developer*  
GitHub: [@Venisbhalara](https://github.com/Venisbhalara) &bull; Project: [WESTWARD Atelier](https://github.com/Venisbhalara/Westward)

<br />

<div align="center">
  <sub>&copy; WESTWARD ATELIER. All rights reserved. Designed for excellence.</sub>
</div>
