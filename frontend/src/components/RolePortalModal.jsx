import React from 'react';

export default function RolePortalModal({ isOpen, onClose, currentRole, onSelectRole }) {
  if (!isOpen) return null;

  const roles = [
    { key: 'buyer', title: 'Buyer Mode', desc: 'Browse products, reserve stock, place express orders' },
    { key: 'merchant', title: 'Merchant Mode', desc: 'Manage store catalog, accept orders & pack items' },
    { key: 'rider', title: 'Rider Mode', desc: 'Receive delivery dispatches & update GPS location' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>👤 Switch Demo Portal Role</h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Experience the VJ-Shopping-World platform from different user perspectives:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {roles.map((r) => (
            <div
              key={r.key}
              className="glass-panel"
              style={{ 
                padding: '1rem', 
                cursor: 'pointer', 
                borderColor: currentRole === r.key ? 'var(--primary)' : 'var(--border-color)',
                background: currentRole === r.key ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)'
              }}
              onClick={() => {
                onSelectRole(r.key);
                onClose();
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{r.title}</h4>
                {currentRole === r.key && <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>Active</span>}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
