import React, { useState } from 'react';
import KycVerificationModal from '../components/KycVerificationModal';

export default function UserProfile({ currentUser, onUserUpdated }) {
  const user = currentUser || JSON.parse(localStorage.getItem('vj_user') || '{}');

  const [personalInfo, setPersonalInfo] = useState({
    name: user.name || 'Vishal User',
    phoneNumber: user.phoneNumber || '9876543210',
    email: user.email || 'vishal@vjexpress.com',
    role: user.role || 'BUYER',
    address: 'Flat 402, Green Valley Apartments, Sector 62',
    city: 'Noida',
    pincode: '201301',
    state: 'Uttar Pradesh'
  });

  const [savedSuccess, setSavedSuccess] = useState('');
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycVerified, setKycVerified] = useState(user.isKycVerified || false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = { ...user, ...personalInfo, isKycVerified: kycVerified };
    localStorage.setItem('vj_user', JSON.stringify(updated));
    if (onUserUpdated) onUserUpdated(updated);
    setSavedSuccess('Personal details updated successfully!');
    setTimeout(() => setSavedSuccess(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-xl">
        {/* Header Header */}
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
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Account ID: VJ-USER-{user.id ? user.id.slice(0, 8) : '89271'} • Verified Member
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {kycVerified ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                🛡️ GOVT PROOF VERIFIED
              </span>
            ) : (
              <button
                onClick={() => setShowKycModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-xs transition-all"
              >
                📄 Verify Govt Proof (GSTIN/DL/Aadhaar)
              </button>
            )}
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
            ✓ {savedSuccess}
          </div>
        )}

        {/* Account Details & Personal Information Form */}
        <form onSubmit={handleSaveProfile} className="mt-8 space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
            📝 Personal & Delivery Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={personalInfo.name}
                onChange={(e) => setFormData({ ...personalInfo, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Mobile Phone Number</label>
              <input
                type="text"
                required
                value={personalInfo.phoneNumber}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phoneNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
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
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={personalInfo.pincode}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, pincode: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
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

          {/* Government Document Status Card */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3">
              🆔 Government Proof & KYB Verification
            </h2>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {personalInfo.role === 'MERCHANT' ? 'GSTIN Tax Document & Penny Drop' : personalInfo.role === 'RIDER' ? 'Driving License & Aadhaar DigiLocker' : 'Aadhaar / Passport Verification'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Status: {kycVerified ? 'Verified & Active in Govt Registry' : 'Pending Verification'}
                </div>
              </div>
              {!kycVerified && (
                <button
                  type="button"
                  onClick={() => setShowKycModal(true)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs"
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-md transition-all active:scale-95"
            >
              Save Account & Personal Details
            </button>
          </div>
        </form>
      </div>

      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        role={personalInfo.role}
        onKycComplete={() => {
          setKycVerified(true);
          setShowKycModal(false);
        }}
      />
    </div>
  );
}
