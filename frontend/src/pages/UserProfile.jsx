import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KycVerificationModal from '../components/KycVerificationModal';
import OrderTrackerModal from '../components/OrderTrackerModal';
import { API_BASE_URL } from '../config/api';

export default function UserProfile({ currentUser, onUserUpdated, onLogout }) {
  const navigate = useNavigate();
  const user = currentUser || JSON.parse(localStorage.getItem('vj_user') || '{}');

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders' | 'settings'

  // Personal details state
  const [personalInfo, setPersonalInfo] = useState({
    name: user.name || 'Vishal User',
    phoneNumber: user.phoneNumber || '9876543210',
    email: user.email || 'vishal@vjexpress.com',
    role: user.role || 'BUYER',
    address: user.address || 'Flat 402, Green Valley Apartments, Sector 62',
    city: user.city || 'Noida',
    pincode: user.pincode || '201301',
    state: user.state || 'Uttar Pradesh'
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycVerified, setKycVerified] = useState(user.isKycVerified || false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders' && user.id) {
      fetchUserOrders();
    }
  }, [activeTab, user.id]);

  const fetchUserOrders = async () => {
    setLoadingOrders(true);
    let userOrders = [];

    // 1. Read orders stored locally for this specific user ID
    if (user && user.id) {
      try {
        const localSaved = localStorage.getItem(`vj_user_orders_${user.id}`);
        if (localSaved) {
          userOrders = JSON.parse(localSaved);
        }
      } catch (e) {}
    }

    // 2. Fetch remote orders from API for this specific user ID
    try {
      if (user && user.id) {
        const res = await fetch(`${API_BASE_URL}/orders/user/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            const dbOrdersMap = new Map();
            data.orders.forEach((o) => dbOrdersMap.set(o.id, o));
            userOrders.forEach((o) => {
              if (!dbOrdersMap.has(o.id)) {
                dbOrdersMap.set(o.id, o);
              }
            });
            userOrders = Array.from(dbOrdersMap.values());
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote user orders:', err);
    } finally {
      setOrders(userOrders);
      setLoadingOrders(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess('');
    setErrorMsg('');

    if (personalInfo.phoneNumber.length !== 10) {
      setErrorMsg('Mobile number must be a valid 10-digit numeric phone number.');
      setSaving(false);
      return;
    }

    const updatedUserObj = { ...user, ...personalInfo, isKycVerified: kycVerified };

    try {
      const token = localStorage.getItem('vj_token');
      if (token) {
        const res = await fetch(`${API_BASE_URL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: personalInfo.name,
            phoneNumber: personalInfo.phoneNumber
          })
        });

        if (!res.ok) {
          const data = await res.json();
          setErrorMsg(data.error || 'Failed to update profile on server.');
        }
      }

      localStorage.setItem('vj_user', JSON.stringify(updatedUserObj));
      if (onUserUpdated) onUserUpdated(updatedUserObj);

      setSavedSuccess('Personal details updated successfully!');
      setTimeout(() => setSavedSuccess(''), 3000);
    } catch (err) {
      localStorage.setItem('vj_user', JSON.stringify(updatedUserObj));
      if (onUserUpdated) onUserUpdated(updatedUserObj);
      setSavedSuccess('Profile saved locally!');
      setTimeout(() => setSavedSuccess(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePerformLogout = () => {
    localStorage.removeItem('vj_token');
    localStorage.removeItem('vj_user');
    if (onLogout) onLogout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);

    try {
      const token = localStorage.getItem('vj_token');
      if (token) {
        await fetch(`${API_BASE_URL}/auth/account`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      }

      handlePerformLogout();
    } catch (err) {
      handlePerformLogout();
    } finally {
      setDeletingAccount(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-xl">
        {/* User Header Summary Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-md">
              👤
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {personalInfo.name}
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {personalInfo.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
                📱 {personalInfo.phoneNumber} • Account ID: VJ-{user.id ? user.id.slice(0, 8) : '89271'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {kycVerified ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                🛡️ GOVT VERIFIED
              </span>
            ) : (
              <button
                onClick={() => setShowKycModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-xs transition-all"
              >
                📄 Verify Govt Proof
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Tabs Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mt-6 mb-8 gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            👤 Personal Profile & Address
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            📦 My Orders & History
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            ⚙️ Account Settings & Logout
          </button>
        </div>

        {/* TAB 1: PERSONAL PROFILE & SAVED ADDRESS */}
        {activeTab === 'profile' && (
          <div>
            {savedSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ✓ {savedSuccess}
              </div>
            )}
            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
                📝 Edit Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={personalInfo.name}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Mobile Phone Number (10 Digits)</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    required
                    value={personalInfo.phoneNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPersonalInfo({ ...personalInfo, phoneNumber: digits });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Account Role & Authorization</label>
                  <select
                    value={personalInfo.role}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BUYER">Customer / Buyer</option>
                    <option value="MERCHANT">Merchant / Store Owner</option>
                    <option value="RIDER">Delivery Bike Partner</option>
                  </select>
                </div>
              </div>

              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white pt-4 mb-4 border-t border-slate-200 dark:border-slate-700">
                📍 Saved Delivery Address Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Flat / Building / House No. & Street</label>
                  <input
                    type="text"
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">City</label>
                    <input
                      type="text"
                      value={personalInfo.city}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Pincode (6 Digits)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={personalInfo.pincode}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setPersonalInfo({ ...personalInfo, pincode: digits });
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">State</label>
                    <input
                      type="text"
                      value={personalInfo.state}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, state: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Account & Personal Details'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: MY ORDERS & PURCHASE HISTORY */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
              🛍️ Order History & Live Delivery Status
            </h2>

            {loadingOrders ? (
              <div className="text-center py-12 text-slate-400 text-sm">Loading your orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                <div className="text-4xl mb-3">🛒</div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No orders placed yet</h3>
                <p className="text-xs text-slate-500 mt-1">Explore our product catalog and place your first 15-min delivery order!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => {
                  const totalRupees = (Number(ord.totalAmount) / 100).toFixed(2);
                  const statusColors = {
                    CREATED: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400',
                    MERCHANT_PREPARING: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400',
                    OUT_FOR_DELIVERY: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400',
                    DELIVERED: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400'
                  };

                  return (
                    <div
                      key={ord.id}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                              #{ord.id.slice(0, 14)}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColors[ord.status] || 'bg-slate-100 text-slate-600'}`}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            📅 Placed on: {formatDate(ord.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            ₹{totalRupees}
                          </span>
                          <button
                            onClick={() => setSelectedTrackOrder(ord)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-xs transition-all active:scale-95"
                          >
                            👁️ Track Live Status
                          </button>
                        </div>
                      </div>

                      {/* Items List */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                {item.image && (
                                  <img src={item.image} alt={item.title} className="w-8 h-8 rounded-lg object-cover" />
                                )}
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {item.title} <span className="text-slate-400">× {item.quantity}</span>
                                </span>
                              </div>
                              <span className="font-mono text-slate-500">
                                ₹{(Number(item.pricePaise * item.quantity) / 100).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Address */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        📍 Delivered to: {ord.shippingAddress?.street || 'Sector 62'}, {ord.shippingAddress?.city || 'Noida'} ({ord.shippingAddress?.pincode || '201301'})
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACCOUNT SETTINGS & DANGER ZONE */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Logout Card */}
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
                🔒 Account Logout
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Sign out safely from your session. Your saved items and account settings will remain intact.
              </p>
              <button
                onClick={handlePerformLogout}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-full font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                🚪 Log Out of Account
              </button>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mb-2">
                ⚠️ Danger Zone: Permanent Account Deletion
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Once you delete your account, your personal information will be permanently deactivated and removed from the active user index.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                🗑️ Delete My VJ Express Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* READ-ONLY LIVE ORDER TRACKER MODAL */}
      {selectedTrackOrder && (
        <OrderTrackerModal
          order={selectedTrackOrder}
          onClose={() => setSelectedTrackOrder(null)}
          deliveryOtp={selectedTrackOrder.deliveryOtp}
          isReadOnly={true} // Read-only mode: Customer can view live status but cannot mutate state!
        />
      )}

      {/* GOVT PROOF KYC VERIFICATION MODAL */}
      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        role={personalInfo.role}
        onKycComplete={() => {
          setKycVerified(true);
          setShowKycModal(false);
        }}
      />

      {/* CONFIRM DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/80 rounded-2xl flex items-center justify-center text-rose-600 text-2xl mx-auto mb-3">
                ⚠️
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Delete Account?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This action cannot be undone. Type <strong className="text-rose-600">DELETE</strong> to confirm permanent deletion.
              </p>
            </div>

            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono text-center mb-4 focus:outline-none focus:border-rose-500"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-full"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full disabled:opacity-40 transition-all"
              >
                {deletingAccount ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
