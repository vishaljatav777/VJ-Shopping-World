import React, { useState, useEffect } from 'react';
import KycVerificationModal from './KycVerificationModal';
import { API_BASE_URL } from '../config/api';

export default function MerchantDashboard({ currentUser, onRefreshProducts, onRoleUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [agreedRules, setAgreedRules] = useState(false);

  const [newProduct, setNewProduct] = useState({
    sku: '',
    title: '',
    description: '',
    category: 'Grocery',
    priceRupees: 100,
    stockQuantity: 50,
    imageUrl: ''
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/dashboard`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.warn('Merchant dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/upload/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: reader.result })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setNewProduct((prev) => ({ ...prev, imageUrl: data.url }));
        }
      } catch (err) {
        console.error('Image upload failed:', err);
      } finally {
        setUploadingImage(false);
      }
    };
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewProduct({
          sku: '',
          title: '',
          description: '',
          category: 'Grocery',
          priceRupees: 100,
          stockQuantity: 50,
          imageUrl: ''
        });
        fetchDashboard();
        if (onRefreshProducts) onRefreshProducts();
      }
    } catch (err) {
      console.error('Error creating product:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchDashboard();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 dark:text-slate-400">
        <p>Loading Merchant Seller Portal...</p>
      </div>
    );
  }

  // Guard 1: Not logged in
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-8 shadow-xl space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">
            🏪
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Merchant Seller Portal Access</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You must sign in or register an authorized Merchant store account with verified statutory documents to list products and receive store orders.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/auth?role=MERCHANT" className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold text-sm shadow-md inline-block">
              🔐 Sign In as Merchant Store
            </a>
            <a href="/auth?role=MERCHANT" className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-full font-bold text-sm shadow-xs inline-block">
              🏪 Register New Merchant Store
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Guard 2: Logged in, but Role is not MERCHANT (e.g. BUYER or RIDER)
  if (currentUser.role !== 'MERCHANT') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md">
              📋
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Merchant Seller Onboarding & Rules</h2>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Current Role: {currentUser.role} (Upgrade Required)</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">📜 VJ Express Seller Rules & Regulations</h3>
            <ul className="space-y-2 list-disc pl-4">
              <li>Must provide a valid 15-character Indian <strong>GSTIN number</strong> for legal tax invoicing.</li>
              <li>Must link a verified <strong>Bank Account (IFSC & Account No)</strong> for instant escrow payouts.</li>
              <li>Must commit to a <strong>15-minute dispatch SLA</strong> for local neighborhood orders.</li>
              <li>Merchants are permitted to buy products as a customer, but cannot act as a delivery rider unless separate rider credentials & vehicle verification are completed.</li>
            </ul>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl">
            <input
              type="checkbox"
              id="rulesCheck"
              checked={agreedRules}
              onChange={(e) => setAgreedRules(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded cursor-pointer"
            />
            <label htmlFor="rulesCheck" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              I agree to the VJ Express Merchant Store Terms, GST rules, and 15-min dispatch SLA.
            </label>
          </div>

          <button
            disabled={!agreedRules}
            onClick={() => setShowKycModal(true)}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-full font-bold text-sm shadow-md transition-all"
          >
            Submit GSTIN & Bank Verification to Activate Seller Dashboard ➔
          </button>
        </div>

        <KycVerificationModal
          isOpen={showKycModal}
          onClose={() => setShowKycModal(false)}
          role="MERCHANT"
          onKycComplete={async () => {
            setShowKycModal(false);
            try {
              const token = localStorage.getItem('vj_token');
              if (token) {
                const res = await fetch(`${API_BASE_URL}/auth/role`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ role: 'MERCHANT' })
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data.token) localStorage.setItem('vj_token', data.token);
                }
              }
            } catch (err) {}

            const updatedUser = { ...currentUser, role: 'MERCHANT', isKycVerified: true };
            localStorage.setItem('vj_user', JSON.stringify(updatedUser));
            if (onRoleUpdated) onRoleUpdated(updatedUser);
            fetchDashboard();
          }}
        />
      </div>
    );
  }

  const merchant = data?.merchant || {
    legalName: 'VJ Express Merchant Store',
    gstNumber: '07AAAAA0000A1Z5',
    isKycVerified: true,
    ledgerBalancePaise: '450000'
  };

  const orders = data?.orders || [];
  const products = data?.products || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Merchant Header Panel */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ✓ KYC VERIFIED MERCHANT STORE
              </span>
              <button 
                onClick={() => setShowKycModal(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Verify Govt Documents 📄
              </button>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {merchant.legalName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">GSTIN: {merchant.gstNumber}</p>
          </div>

          <button 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-sm transition-all active:scale-95 w-fit" 
            onClick={() => setShowAddModal(true)}
          >
            + Add New Product
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ledger Earnings</span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{((BigInt(merchant.ledgerBalancePaise || 0)) / 100n).toString()}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Catalog Products</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{products.length} Items</div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Store Orders Received</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{orders.length} Orders</div>
          </div>
        </div>
      </div>

      {/* Incoming Store Orders */}
      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">📦 Incoming Merchant Orders</h3>
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          No store orders received yet. Place an order from the Marketplace to test!
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div 
              key={o.id} 
              className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-3">
                  <strong className="text-base font-bold text-slate-900 dark:text-white">Order #{o.id.slice(0, 8)}</strong>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {o.status}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Customer: {o.buyer?.name || 'Vishal Buyer'} • Total: ₹{(parseInt(o.totalAmount) / 100).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {o.status === 'CREATED' && (
                  <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-xs transition-all" onClick={() => handleUpdateOrderStatus(o.id, 'MERCHANT_PREPARING')}>
                    Accept & Pack
                  </button>
                )}
                {o.status === 'MERCHANT_PREPARING' && (
                  <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs shadow-xs transition-all" onClick={() => handleUpdateOrderStatus(o.id, 'READY_FOR_PICKUP')}>
                    Mark Ready for Pickup
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KYB Document Verification Modal */}
      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        role="MERCHANT"
        onKycComplete={() => fetchDashboard()}
      />

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">+ Add Store Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Product Title</label>
                <input 
                  type="text" 
                  required 
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">SKU Code</label>
                  <input 
                    type="text" 
                    required 
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Local Stores">Local Stores</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={newProduct.priceRupees}
                    onChange={(e) => setNewProduct({ ...newProduct, priceRupees: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Stock Quantity</label>
                  <input 
                    type="number" 
                    required 
                    value={newProduct.stockQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Cloudinary Image Upload */}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  ☁️ Cloudinary Product Image Upload
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 dark:text-slate-400"
                />
                {uploadingImage && <span className="text-xs text-amber-500 ml-2">Uploading to Cloudinary...</span>}
                {newProduct.imageUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={newProduct.imageUrl} alt="Uploaded preview" className="w-10 h-10 object-cover rounded border border-slate-200 dark:border-slate-700" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓ Cloudinary URL Attached</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Description</label>
                <textarea 
                  required 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 h-16"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-semibold text-xs" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-xs" disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading Image...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
