import { useState, useCallback } from 'react';
import { hashPIN } from '../utils/hashPin';
import './PinLock.css';

const PIN_STORAGE_KEY = 'awa_pin';
const KEYPAD = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
];

export default function PinLock({ onUnlock }) {
  const storedPin = () => localStorage.getItem(PIN_STORAGE_KEY);

  const [mode, setMode] = useState(storedPin() ? 'unlock' : 'setup'); // 'unlock' | 'setup' | 'confirm'
  const [buffer, setBuffer] = useState('');
  const [tempPin, setTempPin] = useState(null);
  const [title, setTitle] = useState(
    storedPin() ? 'Enter your PIN to continue' : 'Create a 4-digit PIN to secure your data'
  );
  const [error, setError] = useState(false);

  const processPin = useCallback(
    async (pin) => {
      // ── Setup: first entry, ask for confirmation ──
      if (mode === 'setup') {
        setTempPin(pin);
        setBuffer('');
        setTitle('Confirm your PIN');
        setMode('confirm');
        return;
      }

      // ── Confirm: second entry must match ──
      if (mode === 'confirm') {
        if (pin === tempPin) {
          const hashed = await hashPIN(pin);
          localStorage.setItem(PIN_STORAGE_KEY, hashed);
          setBuffer('');
          onUnlock();
        } else {
          setError(true);
          setTitle('PINs did not match. Start again.');
          setBuffer('');
          setTimeout(() => {
            setError(false);
            setTitle('Create a 4-digit PIN to secure your data');
            setMode('setup');
            setTempPin(null);
          }, 1400);
        }
        return;
      }

      // ── Unlock: compare against stored hash ──
      const stored = storedPin();
      if (!stored) {
        setBuffer('');
        setMode('setup');
        setTitle('Create a 4-digit PIN to secure your data');
        return;
      }
      const hashed = await hashPIN(pin);
      if (hashed === stored) {
        setBuffer('');
        onUnlock();
      } else {
        setError(true);
        setTitle('Wrong PIN. Try again.');
        setBuffer('');
        setTimeout(() => {
          setError(false);
          setTitle('Enter your PIN to continue');
        }, 1400);
      }
    },
    [mode, tempPin, onUnlock]
  );

  const pressKey = (digit) => {
    if (buffer.length >= 4) return;
    const next = buffer + digit;
    setBuffer(next);
    if (next.length === 4) {
      setTimeout(() => processPin(next), 180);
    }
  };

  const pressDelete = () => setBuffer((b) => b.slice(0, -1));

  const forgotPin = () => {
    const ok = window.confirm(
      'This will erase ALL inventory, sales, and data. Are you absolutely sure?'
    );
    if (ok) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="pin-overlay">
      <div className="pin-logo">StockMaster</div>
      <div className="pin-sub">AWA Inventory Pro</div>
      <div className="pin-title">{title}</div>

      <div className="pin-dots">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={'pin-dot' + (i < buffer.length ? ' filled' : '') + (error ? ' error' : '')}
          />
        ))}
      </div>

      <div className="pin-grid">
        {KEYPAD.map(({ digit, sub }) => (
          <button key={digit} className="pin-btn" onClick={() => pressKey(digit)}>
            {digit}
            <span className="pin-btn-sub">{sub}</span>
          </button>
        ))}
        <button className="pin-btn" style={{ visibility: 'hidden' }} />
        <button className="pin-btn zero" onClick={() => pressKey('0')}>
          0
        </button>
        <button className="pin-btn del" onClick={pressDelete}>
          <i className="fa-solid fa-delete-left" />
        </button>
      </div>

      <div className="pin-forgot" onClick={forgotPin}>
        Forgot PIN? Reset app data
      </div>
    </div>
  );
}
