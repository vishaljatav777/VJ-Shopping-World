import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { API_BASE_URL } from './config/api';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import OrderTrackerModal from './components/OrderTrackerModal';
import LocationModal from './components/LocationModal';
import MerchantDashboard from './components/MerchantDashboard';
import RiderConsole from './components/RiderConsole';

import AuthPage from './pages/AuthPage';
import Login from './pages/Login';
import Registration from './pages/Registration';
import UserProfile from './pages/UserProfile';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Sector 62, Noida');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('vj_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Theme Manager State: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vj_theme') || 'system';
  });

  // Tracked active order & delivery OTP
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeDeliveryOtp, setActiveDeliveryOtp] = useState('');
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  const categories = ['All', 'Grocery', 'Electronics', 'Fresh Produce', 'Local Stores'];

  useEffect(() => {
    localStorage.setItem('vj_theme', theme);

    const applyTheme = () => {
      let activeTheme = theme;
      if (theme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', activeTheme);
      if (activeTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => {
        const activeTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', activeTheme);
        if (activeTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          return;
        }
      }
      setProducts([]);
    } catch (err) {
      console.warn('Backend API connection warning:', err);
      setProducts([]);
    }
  };

  const handleAddToCart = (product, change) => {
    const id = product._id || product.id;
    setCartItems((prev) => {
      const existing = prev.find((item) => (item._id || item.id) === id);
      if (existing) {
        const newQty = existing.quantity + change;
        if (newQty <= 0) {
          return prev.filter((item) => (item._id || item.id) !== id);
        }
        return prev.map((item) =>
          (item._id || item.id) === id ? { ...item, quantity: newQty } : item
        );
      } else if (change > 0) {
        return [...prev, { ...product, quantity: change }];
      }
      return prev;
    });

    if (change > 0) {
      fetch(`${API_BASE_URL}/cart/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: product.sku || '',
          quantity: change,
          buyerPhone: currentUser?.phoneNumber || ''
        })
      }).catch(() => {});
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckoutSuccess = (order) => {
    setCartItems([]);
    setActiveOrder(order);
    if (order.deliveryOtp) {
      setActiveDeliveryOtp(order.deliveryOtp);
    } else {
      setActiveDeliveryOtp('4892');
    }
    setIsTrackerOpen(true);
  };

  const handleAdvanceOrderStatus = (newStatus) => {
    if (activeOrder) {
      const updated = { ...activeOrder, status: newStatus };
      setActiveOrder(updated);

      fetch(`${API_BASE_URL}/orders/${activeOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).catch(() => {});
    }
  };

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* Navigation Bar */}
        <Navbar
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          location={currentLocation}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={theme}
          setTheme={setTheme}
          currentUser={currentUser}
          onLogout={() => {
            localStorage.removeItem('vj_token');
            localStorage.removeItem('vj_user');
            setCurrentUser(null);
          }}
        />

        {/* Dedicated View Routing */}
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Hero
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />
                  <ProductGrid
                    products={filteredProducts}
                    onAddToCart={handleAddToCart}
                    cartItems={cartItems}
                  />
                </>
              }
            />

            {/* Standalone Merchant Seller Central */}
            <Route
              path="/merchant"
              element={
                <MerchantDashboard 
                  currentUser={currentUser} 
                  onRefreshProducts={fetchProducts} 
                  onRoleUpdated={(u) => setCurrentUser(u)} 
                />
              }
            />

            {/* Standalone Rider Console */}
            <Route
              path="/rider"
              element={
                <RiderConsole 
                  currentUser={currentUser} 
                  onRoleUpdated={(u) => setCurrentUser(u)} 
                />
              }
            />

            {/* Standalone Login Route */}
            <Route
              path="/login"
              element={<Login onLoginSuccess={(user) => setCurrentUser(user)} />}
            />

            {/* Standalone Registration Route */}
            <Route
              path="/register"
              element={<Registration onLoginSuccess={(user) => setCurrentUser(user)} />}
            />

            {/* Authentication & Account Registration Tabbed Page */}
            <Route
              path="/auth"
              element={<AuthPage onLoginSuccess={(user) => setCurrentUser(user)} />}
            />

            {/* Personal Details & Govt Proof Verification Profile */}
            <Route
              path="/profile"
              element={
                <UserProfile 
                  currentUser={currentUser} 
                  onUserUpdated={(u) => setCurrentUser(u)} 
                  onLogout={() => {
                    localStorage.removeItem('vj_token');
                    localStorage.removeItem('vj_user');
                    setCurrentUser(null);
                  }}
                />
              }
            />
          </Routes>
        </main>

        {/* Dedicated Footer Component */}
        <Footer />

        {/* Slide-Over Cart Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQty={(item, change) => handleAddToCart(item, change)}
          onCheckoutSuccess={handleCheckoutSuccess}
          currentUser={currentUser}
        />

        {/* Live Order Tracker Modal */}
        <OrderTrackerModal
          order={activeOrder}
          onClose={() => setIsTrackerOpen(false)}
          onAdvanceStatus={handleAdvanceOrderStatus}
          deliveryOtp={activeDeliveryOtp}
        />

        {/* Location Picker Modal */}
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          currentLocation={currentLocation}
          onSelectLocation={setCurrentLocation}
        />

        {/* Vercel Web Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />
      </div>
    </BrowserRouter>
  );
}