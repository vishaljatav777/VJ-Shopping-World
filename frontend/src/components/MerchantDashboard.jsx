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

  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editModalError, setEditModalError] = useState('');
  const [editModalSuccess, setEditModalSuccess] = useState('');

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

  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setModalError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

        // Set instant preview immediately for amazing UX
        setNewProduct((prev) => ({ ...prev, imageUrl: compressedDataUrl }));

        fetch(`${API_BASE_URL}/upload/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: compressedDataUrl })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.url) {
              setNewProduct((prev) => ({ ...prev, imageUrl: data.url }));
            }
          })
          .catch((err) => {
            console.warn('Cloudinary upload sync warning, using client compressed image:', err);
          })
          .finally(() => {
            setUploadingImage(false);
          });
      };
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!newProduct.title.trim()) {
      setModalError('Please enter a product title.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/merchant/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          priceRupees: Number(newProduct.priceRupees) || 0,
          stockQuantity: Number(newProduct.stockQuantity) || 0
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || 'Failed to save product. Please check input values.');
        return;
      }

      setModalSuccess('✓ Product added successfully to your store catalog!');
      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess('');
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
      }, 800);
    } catch (err) {
      console.error('Error creating product:', err);
      setModalError('Network error while saving product.');
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${product.title}"?\n\nThis will permanently remove the product and delete its associated image from Cloudinary.`
    );
    if (!confirmDelete) return;

    setDeletingProductId(product._id);
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/products/${product._id}`, {
        method: 'DELETE'
      });
      const resData = await res.json();
      if (res.ok) {
        alert('✓ Product and associated Cloudinary image deleted successfully!');
        fetchDashboard();
        if (onRefreshProducts) onRefreshProducts();
      } else {
        alert(resData.error || 'Failed to delete product.');
      }
    } catch (err) {
      console.error('Delete product error:', err);
      alert('Error deleting product. Please check your connection.');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleOpenEditModal = (prod) => {
    setEditModalError('');
    setEditModalSuccess('');
    setEditingProduct({
      _id: prod._id,
      sku: prod.sku || '',
      title: prod.title || '',
      description: prod.description || '',
      category: prod.category || 'Grocery',
      priceRupees: prod.pricePaise ? (prod.pricePaise / 100).toString() : (prod.priceRupees || 100).toString(),
      stockQuantity: prod.stockQuantity ?? 50,
      imageUrl: prod.images?.[0] || prod.imageUrl || ''
    });
  };

  const handleFileUploadForEdit = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEditUploadingImage(true);
    setEditModalError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setEditingProduct((prev) => ({ ...prev, imageUrl: compressedDataUrl }));

        fetch(`${API_BASE_URL}/upload/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: compressedDataUrl })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.url) {
              setEditingProduct((prev) => ({ ...prev, imageUrl: data.url }));
            }
          })
          .catch((err) => {
            console.warn('Edit image upload warning:', err);
          })
          .finally(() => {
            setEditUploadingImage(false);
          });
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditedProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setEditModalError('');
    setEditModalSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/merchant/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: editingProduct.sku,
          title: editingProduct.title,
          description: editingProduct.description,
          category: editingProduct.category,
          priceRupees: Number(editingProduct.priceRupees) || 0,
          stockQuantity: Number(editingProduct.stockQuantity) || 0,
          imageUrl: editingProduct.imageUrl
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setEditModalError(data.error || 'Failed to update product.');
        return;
      }

      setEditModalSuccess('✓ Product updated successfully!');
      setTimeout(() => {
        setEditingProduct(null);
        setEditModalSuccess('');
        fetchDashboard();
        if (onRefreshProducts) onRefreshProducts();
      }, 700);
    } catch (err) {
      console.error('Update product error:', err);
      setEditModalError('Network error while saving changes.');
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
    legalName: currentUser?.name ? `${currentUser.name}'s Store` : 'My Seller Store',
    gstNumber: 'Not Registered / Pending Verification',
    isKycVerified: currentUser?.isKycVerified || false,
    ledgerBalancePaise: '0'
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

      {/* 🛍️ Product Catalog & Inventory Management */}
      <div className="mt-10 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🛍️ Store Catalog & Inventory</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {products.length} Products
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Modify product details, update pricing/stock, or remove items & Cloudinary assets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Filter Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search catalog by title or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
            </div>

            {/* Category Filter */}
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="Grocery">Grocery</option>
              <option value="Electronics">Electronics</option>
              <option value="Fresh Produce">Fresh Produce</option>
              <option value="Local Stores">Local Stores</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1"
            >
              <span>+ Add Product</span>
            </button>
          </div>
        </div>

        {/* Product Catalog Grid */}
        {products.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            <p className="text-2xl mb-2">📦</p>
            <p className="font-bold text-slate-900 dark:text-white mb-1">No products in catalog yet</p>
            <p className="text-xs">Click "+ Add New Product" above to list your first item!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products
              .filter((p) => {
                const matchesSearch =
                  !productSearch ||
                  p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.sku?.toLowerCase().includes(productSearch.toLowerCase());
                const matchesCat = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
                return matchesSearch && matchesCat;
              })
              .map((prod) => {
                const img = prod.images?.[0] || prod.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
                const price = prod.pricePaise ? (prod.pricePaise / 100).toFixed(2) : Number(prod.priceRupees || 0).toFixed(2);
                const stock = prod.stockQuantity ?? 0;
                const isDeleting = deletingProductId === prod._id;

                return (
                  <div
                    key={prod._id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-44 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                      <img
                        src={img}
                        alt={prod.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/75 backdrop-blur-xs text-white">
                        {prod.category}
                      </span>
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-xs">
                        ₹{price}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-mono truncate">{prod.sku || 'SKU-PROD'}</span>
                          {stock > 10 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">In Stock ({stock})</span>
                          ) : stock > 0 ? (
                            <span className="text-amber-500 font-bold">Low Stock ({stock})</span>
                          ) : (
                            <span className="text-rose-500 font-bold">Out of Stock</span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {prod.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {prod.description}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <span>✏️ Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod)}
                          disabled={isDeleting}
                          className="py-1.5 px-3 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold transition-all border border-rose-200 dark:border-rose-800 disabled:opacity-50"
                          title="Delete Product and remove Cloudinary image"
                        >
                          {isDeleting ? '⌛' : '🗑️ Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">✏️ Edit Store Product</h3>

            {editModalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 mb-4">
                ⚠️ {editModalError}
              </div>
            )}
            {editModalSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 mb-4">
                {editModalSuccess}
              </div>
            )}

            <form onSubmit={handleSaveEditedProduct} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
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
                    value={editingProduct.priceRupees}
                    onChange={(e) => setEditingProduct({ ...editingProduct, priceRupees: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stockQuantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Product Image File Dropzone for Edit */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>📸 Product Image</span>
                  {editUploadingImage && <span className="text-xs text-amber-500 font-bold animate-pulse">☁️ Uploading Image...</span>}
                </label>

                {editingProduct.imageUrl ? (
                  <div className="relative p-2 bg-slate-50 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                    <img
                      src={editingProduct.imageUrl}
                      alt="Product Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Image Ready</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{editingProduct.imageUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProduct((prev) => ({ ...prev, imageUrl: '' }))}
                      className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold transition-all border border-rose-200 dark:border-rose-800"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center transition-all bg-slate-50 dark:bg-slate-900/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadForEdit}
                      className="hidden"
                      id="editProductImageFileInput"
                    />
                    <label htmlFor="editProductImageFileInput" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <span className="text-2xl">📷</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        Click to Replace Image
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Description</label>
                <textarea
                  required
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 h-16"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full font-bold text-xs transition-all"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-full font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  disabled={editUploadingImage}
                >
                  {editUploadingImage ? '☁️ Uploading Image...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
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
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">+ Add Store Product</h3>
            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 mb-4">
                ⚠️ {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 mb-4">
                {modalSuccess}
              </div>
            )}
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

              {/* Product Image File Dropzone & Instant Preview */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>📸 Product Image</span>
                  {uploadingImage && <span className="text-xs text-amber-500 font-bold animate-pulse">☁️ Uploading Image...</span>}
                  {newProduct.imageUrl && !uploadingImage && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓ Image Ready</span>}
                </label>

                {newProduct.imageUrl ? (
                  <div className="relative p-2 bg-slate-50 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                    <img
                      src={newProduct.imageUrl}
                      alt="Product Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Image Attached</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{newProduct.imageUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewProduct((prev) => ({ ...prev, imageUrl: '' }))}
                      className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold transition-all border border-rose-200 dark:border-rose-800"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center transition-all bg-slate-50 dark:bg-slate-900/50">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="productImageFileInput"
                    />
                    <label htmlFor="productImageFileInput" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <span className="text-2xl">📷</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        Click to Choose Product Image
                      </span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WebP up to 10MB</span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Description</label>
                <textarea 
                  required 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Describe key product details..."
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 h-16"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full font-bold text-xs transition-all"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-full font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? '☁️ Uploading Image...' : '💾 Save & Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
