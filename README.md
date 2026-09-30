# 🍽️ The Purna Fork — Luxury Fine Dining & Digital Restaurant Platform

A modern, production-grade enterprise web application for **The Purna Fork** fine dining restaurant featuring real-time table seating availability, digital gourmet food ordering & customization, persistent database backend, VIP loyalty rewards, and a dedicated staff/kitchen management portal.

---

## ✨ Features

- 🛍️ **Online Ordering & Cart System**:
  - Slide-over Cart Drawer with real-time tax, delivery fee, and promo discount calculations (`FORK10`).
  - Dish customization modal (Spice levels, Gourmet add-ons, Chef allergy notes).
  - Multi-step checkout with simulated payments (Stripe, UPI/Razorpay, Apple Pay, Cash on Delivery) and printable invoice receipts.

- 📅 **Real-Time Table Reservations**:
  - Dynamic slot availability chips (`Available`, `Filling Fast`, `Full`).
  - Digital reservation passes with SVG QR Code generation.
  - **1-Click Download Calendar Invite (`.ics`)** compatible with Google Calendar, Apple Calendar, and Outlook.
  - "Manage My Booking" lookup portal to check, reschedule, or cancel bookings.

- 🔐 **VIP Customer Loyalty Portal** (`account.html`):
  - Earn 10 loyalty points per $1 spent + 100 signup bonus.
  - Tier badges (**Bronze**, **Silver**, **Gold VIP**, **Platinum VIP**) with interactive progress bar.
  - Order history with 1-click **Re-order** button.

- 👨‍🍳 **Staff & Operations Hub** (`admin.html`):
  - Real-time KPI analytics (Revenue, Orders count, Active bookings, Menu inventory).
  - Live Kitchen Order Manager (`Received` ➔ `In Kitchen` ➔ `Ready` ➔ `Delivered`).
  - Menu CRUD manager (Add dishes, edit prices, toggle In Stock / Out of Stock).
  - Table seating & guest list overview.

- ⭐ **Verified Customer Reviews & Ratings**:
  - 5-Star interactive review submission and dynamic verified testimonial cards.

- 📱 **Progressive Web App (PWA) & Aesthetics**:
  - `manifest.json` for desktop & mobile installation.
  - Dark / Light Mode theme toggle with persistent preferences.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Database & API Server
```bash
npm run server
```
*The REST API server runs at `http://localhost:5000`.*

### 3. Start the Frontend Dev Server
```bash
npm run dev
```
*The application will be accessible at `http://localhost:5173`.*

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+), Font Awesome, Google Fonts
- **Backend & API**: Node.js, Express.js, CORS
- **Database**: Persistent JSON Storage (`data/db.json`)
- **Tooling**: Vite 5, PostCSS, ESLint

---

## 📄 License
MIT License © 2026 The Purna Fork.
