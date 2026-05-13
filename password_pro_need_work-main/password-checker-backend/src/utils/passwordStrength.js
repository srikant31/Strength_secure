// ── Mirrors src/utils/passwordUtils.js on the frontend ──────────────────
// Used for server-side validation so the client can't bypass the strength gate.

const COMMON = new Set([
  'password','password1','password123','123456','12345678','123456789',
  'qwerty','qwerty123','abc123','letmein','monkey','dragon','master',
  'sunshine','princess','welcome','shadow','superman','michael','football',
  'baseball','batman','admin','login','hello','iloveyou','trustno1',
  'starwars','passw0rd','p@ssw0rd','pass123','secret','hunter2','qazwsx',
  'zxcvbn','test','test123',
]);

function charsetSize(p) {
  let s = 0;
  if (/[a-z]/.test(p)) s += 26;
  if (/[A-Z]/.test(p)) s += 26;
  if (/[0-9]/.test(p)) s += 10;
  if (/[^a-zA-Z0-9]/.test(p)) s += 32;
  return s || 1;
}

function entropy(p) {
  return p.length * Math.log2(charsetSize(p));
}

/**
 * Returns a score 0-100 and label.
 * Rejects passwords scoring < 40 ("Weak" threshold).
 */
export function analyzePassword(password) {
  if (!password) return { score: 0, label: 'Empty', acceptable: false };

  const isCommon = COMMON.has(password.toLowerCase());
  const e        = entropy(password);

  const CRITERIA = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
    !isCommon,
    !(/(.)\1{2,}/.test(password)),
  ];
  const WEIGHTS = [1, 2, 1, 1, 1, 2, 2, 1];
  const total   = WEIGHTS.reduce((a, w) => a + w, 0);
  const earned  = CRITERIA.reduce((a, pass, i) => a + (pass ? WEIGHTS[i] : 0), 0);

  const dictScore = isCommon ? 0 : 100;
  const score = Math.round(
    Math.min((e / 100) * 100, 100) * 0.5 +
    (earned / total * 100)          * 0.3 +
    dictScore                       * 0.2
  );

  const clipped = Math.max(0, Math.min(100, score));
  const label   = clipped < 20 ? 'Critically Weak'
                : clipped < 40 ? 'Weak'
                : clipped < 60 ? 'Moderate'
                : clipped < 80 ? 'Strong'
                : 'Very Strong';

  return { score: clipped, label, acceptable: clipped >= 40 };
}
