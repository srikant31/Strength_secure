import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { User }        from '../models/User.model.js';
import crypto from 'crypto';

export const userRouter = Router();

// All user routes require auth
userRouter.use(requireAuth);

/* ── GET /api/users/history ─────────────────────────────────────────────── */
// Returns the stored password history entries (hashes only — never plain text)
userRouter.get('/history', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+passwordHistory');

    const history = (user.passwordHistory || []).map((entry, idx) => ({
      rank:      idx + 1,
      createdAt: entry.createdAt,
      // We expose the hash truncated — enough for UI display, not enough to leak
      hashPreview: entry.hash.slice(0, 12) + '…',
    }));

    res.json({ history });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/users/profile ─────────────────────────────────────────────── */
userRouter.get('/profile', (req, res) => {
  res.json({ user: req.user.toPublic() });
});

/* ── GET /api/users/check-email?email=xxx ───────────────────────────────── */
// Uses XposedOrNot free API — no API key required
userRouter.get('/check-email', async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'email query param required' });

    const url = `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email.trim())}`;
    const xonRes = await fetch(url, {
      headers: { 'User-Agent': 'SecureVault-App' },
    });

    const data = await xonRes.json();

    // XposedOrNot returns { Error: "Not found" } when email is clean
    if (data.Error === 'Not found' || xonRes.status === 404) {
      return res.json({ breaches: [], safe: true });
    }

    if (!xonRes.ok) {
      return res.status(500).json({ message: `XposedOrNot API returned ${xonRes.status}.` });
    }

    // data.breaches is [ [site1, site2, ...] ] — a nested array
    const siteNames = Array.isArray(data.breaches?.[0]) ? data.breaches[0] : [];

    res.json({ breaches: siteNames, safe: siteNames.length === 0 });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/users/check-password ─────────────────────────────────────── */
// k-Anonymity password breach check (no API key needed — done server-side)
userRouter.get('/check-password', async (req, res, next) => {
  try {
    const { password } = req.query;
    if (!password) return res.status(400).json({ message: 'password query param required' });

    const hash   = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const hibpRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!hibpRes.ok) throw new Error('HIBP password API unavailable');

    const text  = await hibpRes.text();
    let count = 0;
    for (const line of text.split('\r\n')) {
      const [s, c] = line.split(':');
      if (s === suffix) { count = parseInt(c, 10); break; }
    }

    res.json({ count, breached: count > 0 });
  } catch (err) {
    next(err);
  }
});

