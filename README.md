# 🛍️ VJ Express — Hyperlocal 15-Minute E-Commerce Platform

A production-grade, full-stack hyperlocal e-commerce platform built for 15-minute express neighborhood deliveries. Supporting **Customer Marketplace**, **Merchant Seller Central**, **Rider Delivery Console**, **3-Way Theme Switcher (Light, Dark, System Auto)**, and statutory **Government Document Proof Verification** (GSTIN, Bank Account Penny Drop, Driving License, Masked 12-digit Aadhaar).

---

## 🌟 Key Features & Architecture

### 1. 🎨 Dynamic 3-Way Theme Engine
- **☀️ Light Theme**: Clean off-white (`#f8fafc`) aesthetic with indigo primary accents (`#4f46e5`).
- **🌙 Dark Theme**: Modern dark slate (`#0f172a` & `#1e293b`) tailored high-contrast dark mode.
- **💻 System Auto**: Automatically synchronizes with OS preference (`window.matchMedia('(prefers-color-scheme: dark)')`).

### 2. 🔐 Role-Based Access & Onboarding Guards
- **🛒 Customer Marketplace (`/`)**: Public catalog browsing, search, and category filtering. Guest users can explore products; mandatory account creation/login is enforced before placing express orders.
- **🏪 Merchant Seller Central (`/merchant`)**: Protected portal for store management, Cloudinary product image uploads, ledger balance tracking, and order fulfillment. Requires GSTIN format validation and Bank Account KYB verification.
- **🛵 Rider Delivery Console (`/rider`)**: Protected portal for express order dispatches. Requires state Driving License registration and DigiLocker Masked Aadhaar KYC verification.
- **👤 User Account Profile (`/profile`)**: Manage personal details, delivery addresses, and submit government document proof verification.

### 3. 🛡️ Zero-Trust Security & Financial Engine
- **🔑 Doorstep Geofenced OTP Handshake**: 4-digit OTP validation enforced within `<150m` Haversine GPS radius between rider and dropoff coordinates.
- **📄 GST Invoice Tax Splitter**: Automatic CGST (2.5%) + SGST (2.5%) intra-state vs. IGST (5%) inter-state statutory invoice generation (`INV/2026-27/0001`).
- **⚡ Dynamic Risk Score Evaluator**: Flags high-value Cash on Delivery (COD) orders and calculates risk scores.
- **💰 Double-Entry Escrow Ledger**: Financial updates stored strictly in integer Paise (`BigInt`) to prevent floating-point errors.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), React Router v6.
- **Backend**: Node.js, Express, TypeScript (`tsx`), JWT authentication, bcryptjs password hashing.
- **Databases**: PostgreSQL (Prisma ORM), MongoDB Atlas (Mongoose), Redis (ioredis).
- **Storage & Media**: Cloudinary SDK for product image uploads.
- **Testing**: Automated Vitest test suite (`npx tsx src/tests/runTests.ts`).

---

## 📁 Repository Structure

```
VJ-Shopping-World/
├── backend/
│   ├── src/
│   │   ├── middleware/        # JWT Authentication & Role Authorization Middleware
│   │   ├── models/            # Mongoose Schemas (Catalog & Products)
│   │   ├── routes/            # Auth, KYC, Merchant, Rider, Order, Cart & Return APIs
│   │   ├── tests/             # Automated Vitest Test Suite (runTests.ts, securityEngine.test.ts)
│   │   └── utils/             # Security Engine, Haversine Geofence & Tax Splitter
│   ├── prisma/                # Prisma PostgreSQL Schema & Escrow Ledger
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, CartDrawer, MerchantDashboard, RiderConsole, KycModal
│   │   ├── pages/             # AuthPage, UserProfile, Home
│   │   ├── index.css          # Tailwind CSS v4 & Theme Variables
│   │   └── App.jsx            # Routing & Theme State Engine
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup
Create a `.env` file in `backend/` based on `backend/.env.example`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/vj_shopping_world?schema=public"
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/vj_shopping_world?retryWrites=true&w=majority"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="vj_shopping_world_jwt_super_secret_key_2026"
```

### 3. Start Development Servers
```bash
# Terminal 1: Start Backend API Server (http://localhost:5000)
cd backend
npm run dev

# Terminal 2: Start Frontend Vite Dev Server (http://localhost:5174)
cd frontend
npm run dev
```

---

## 🧪 Automated Test Suite

Run the platform test suite:
```bash
cd backend
npx tsx src/tests/runTests.ts
```

### Verified Test Scenarios
- ✅ **Haversine Geofencing**: Validates `<150m` doorstep rider GPS rule.
- ✅ **Risk Score Engine**: Evaluates COD limits and account risk.
- ✅ **GST Tax Invoice Splitter**: Validates CGST/SGST (intra-state) vs IGST (inter-state).
- ✅ **4-Digit Handshake OTP**: Verifies OTP code generation and SHA-256 hashing.
- ✅ **Statutory GSTIN Format**: Regex check for 15-character Indian GSTIN.
- ✅ **Rider Credentials**: Validates Driving License and Masked 12-digit Aadhaar.
- **Status**: **14/14 Test Cases Passed (100% Success)**.

---

## 📄 License
Distributed under the MIT License.
