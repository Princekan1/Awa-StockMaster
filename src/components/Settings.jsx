import { useState, useEffect } from 'react';
import { useStock } from '../context/StockContext';
import './Settings.css';

export default function Settings() {
  const { bizProfile, updateBizProfile, prefs } = useStock();

  const [name, setName] = useState(bizProfile?.name || '');
  const [phone, setPhone] = useState(bizProfile?.phone || '');
  const [address, setAddress] = useState(bizProfile?.address || '');
  const [saved, setSaved] = useState(false);

  // PIN status
  const [pinEnabled, setPinEnabled] = useState(
    () => localStorage.getItem('awa_pin_disabled') !== 'true'
  );

  useEffect(() => {
    setName(bizProfile?.name || '');
    setPhone(bizProfile?.phone || '');
    setAddress(bizProfile?.address || '');
  }, [bizProfile]);

  const handleSaveProfile = () => {
    if (typeof updateBizProfile === 'function') {
      updateBizProfile({ name: name.trim(), phone: phone.trim(), address: address.trim() });
    } else {
      // fallback if context method doesn't exist yet
      localStorage.setItem(
        'awa_biz_profile',
        JSON.stringify({ name: name.trim(), phone: phone.trim(), address: address.trim() })
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const togglePin = () => {
    if (pinEnabled) {
      // Disable PIN
      localStorage.setItem('awa_pin_disabled', 'true');
      setPinEnabled(false);
    } else {
      // Re-enable PIN → remove the disabled flag
      // (user will be asked to set a PIN on next refresh if none exists)
      localStorage.removeItem('awa_pin_disabled');
      setPinEnabled(true);
      window.alert('PIN protection has been re-enabled. Refresh the page to set or enter your PIN.');
    }
  };

  const handleResetAll = () => {
    const ok = window.confirm(
      'This will permanently delete ALL inventory, sales, and settings. This cannot be undone. Continue?'
    );
    if (ok) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="settings-page">
      {/* Business Profile */}
      <div className="settings-card">
        <div className="settings-title">
          <i className="fa-solid fa-store" /> Business Profile
        </div>

        <div className="fgrp">
          <label className="flbl">Business Name</label>
          <input
            className="finput"
            placeholder="e.g. AWA Supermarket"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="fgrp">
          <label className="flbl">Phone Number</label>
          <input
            className="finput"
            placeholder="e.g. 0803 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="fgrp">
          <label className="flbl">Address</label>
          <input
            className="finput"
            placeholder="Optional"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={handleSaveProfile}>
          {saved ? 'SAVED ✓' : 'SAVE PROFILE'}
        </button>
      </div>

      {/* Security */}
      <div className="settings-card">
        <div className="settings-title">
          <i className="fa-solid fa-lock" /> Security
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">PIN Protection</div>
            <div className="settings-row-sub">
              {pinEnabled ? 'PIN is currently enabled' : 'PIN is currently disabled'}
            </div>
          </div>
          <button
            className={'toggle-btn' + (pinEnabled ? ' on' : '')}
            onClick={togglePin}
          >
            {pinEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-card danger">
        <div className="settings-title danger-title">
          <i className="fa-solid fa-triangle-exclamation" /> Danger Zone
        </div>
        <p className="danger-text">
          Resetting will permanently delete all inventory, sales history, and settings.
        </p>
        <button className="btn-danger" onClick={handleResetAll}>
          <i className="fa-solid fa-trash" /> Reset All Data
        </button>
      </div>

      <div className="settings-footer">
        StockMaster · AWA Inventory Pro
      </div>
    </div>
  );
}