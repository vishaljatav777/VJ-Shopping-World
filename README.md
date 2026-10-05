# 🛍️ VJ Express — Hyperlocal E-Commerce Platform

VJ Express is a modern hyperlocal e-commerce application designed for 15-minute express deliveries. It provides a seamless experience for buyers, neighborhood store merchants, and delivery partners.

---

## 🌟 Main Features

### 1. 🎨 Dynamic 3-Way Theme Switcher
- **Light Theme**: Clean off-white design with vibrant indigo accents.
- **Dark Theme**: Modern dark slate high-contrast theme.
- **System Default**: Automatically syncs with device operating system settings.

### 2. 👥 User Portals & Roles
- **Customer Marketplace**: Explore products, filter categories, search items, and place express orders.
- **Merchant Seller Central**: Store management, product uploads, order management, and store earnings overview.
- **Rider Partner Console**: Delivery partner dashboard for accepting dispatches and managing orders.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS v4, React Router
- **Backend**: Node.js, Express, TypeScript, JWT, bcryptjs
- **Databases**: MySQL (Prisma), MongoDB Atlas, Redis

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm

### 1. Installation
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configuration
Copy `.env.example` to `.env` inside `backend/`:
```bash
cp backend/.env.example backend/.env
```

### 3. Run Application
```bash
# Start backend server (http://localhost:5000)
cd backend
npm run dev

# Start frontend application (http://localhost:5174)
cd frontend
npm run dev
```

---

## 🧪 Testing

To execute the automated test suite:
```bash
cd backend
npx tsx src/tests/runTests.ts
```

---

## 📄 License
MIT License.
