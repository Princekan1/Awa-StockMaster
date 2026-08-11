// PIN hashing (SHA-256 via Web Crypto API, with a fallback for contexts
// where crypto.subtle isn't available, e.g. plain http:// or file://).
export async function hashPIN(pin) {
  if (crypto && crypto.subtle) {
    const data = new TextEncoder().encode(pin + 'awa_salt_v1');
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Simple deterministic fallback (obfuscated, not cryptographic — only used
  // when Web Crypto is unavailable).
  let h = 0x811c9dc5;
  const str = pin + 'awa_salt_v1';
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return (
    'fb_' +
    h.toString(16).padStart(8, '0') +
    pin.split('').map((c) => c.charCodeAt(0).toString(16)).join('')
  );
}
