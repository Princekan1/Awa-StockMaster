import { useState, useEffect } from 'react';
import './Header.css';

export default function Header() {
  const [clock, setClock] = useState(() => formatClock());

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock()), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="hdr">
      <div>
        <div className="hdr-logo">StockMaster</div>
        <div className="hdr-sub">AWA Inventory Pro</div>
      </div>
      <div className="hdr-right">
        <div className="hdr-ver">v8.0</div>
        <div className="hdr-badge">{clock}</div>
      </div>
    </header>
  );
}

function formatClock() {
  return new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}
