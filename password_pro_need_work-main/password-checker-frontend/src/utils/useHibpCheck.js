import { useState, useEffect, useRef } from 'react';

/**
 * Real-time HIBP check using the k-Anonymity API.
 * Returns { status: 'idle' | 'checking' | 'safe' | 'breached', count }
 * Debounced by 600ms so it doesn't fire on every keystroke.
 */
export function useHibpCheck(password) {
  const [status, setStatus] = useState('idle');   // idle | checking | safe | breached
  const [count, setCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!password || password.length < 8) {
      setStatus('idle');
      setCount(0);
      return;
    }

    // Debounce
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus('checking');
      try {
        // k-Anonymity: hash in browser using SubtleCrypto
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuf = await crypto.subtle.digest('SHA-1', data);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArr.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        const prefix = hashHex.slice(0, 5);
        const suffix = hashHex.slice(5);

        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!res.ok) throw new Error('HIBP unavailable');

        const text = await res.text();
        const lines = text.split('\r\n');
        let breachCount = 0;

        for (const line of lines) {
          const [s, c] = line.split(':');
          if (s === suffix) {
            breachCount = parseInt(c, 10);
            break;
          }
        }

        setCount(breachCount);
        setStatus(breachCount > 0 ? 'breached' : 'safe');
      } catch {
        // On network error: fail open (don't block the user)
        setStatus('idle');
        setCount(0);
      }
    }, 600);

    return () => clearTimeout(timerRef.current);
  }, [password]);

  return { status, count };
}
