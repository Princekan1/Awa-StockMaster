import { useState, useEffect, useRef } from 'react';

/**
 * Drop-in replacement for useState that persists to localStorage.
 * Mirrors the old pattern of:
 *   let inv = JSON.parse(localStorage.getItem('awa_inv')) || [];
 *   ...
 *   localStorage.setItem('awa_inv', JSON.stringify(inv));
 *
 * Usage:
 *   const [inv, setInv] = useLocalStorageState('awa_inv', []);
 */
export function useLocalStorageState(key, defaultValue) {
  const isFirstRun = useRef(true);

  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch (err) {
      console.warn(`useLocalStorageState: failed to read "${key}"`, err);
      return defaultValue;
    }
  });

  useEffect(() => {
    // Skip the write on mount so we don't re-serialize what we just read
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`useLocalStorageState: failed to write "${key}"`, err);
    }
  }, [key, value]);

  return [value, setValue];
}
