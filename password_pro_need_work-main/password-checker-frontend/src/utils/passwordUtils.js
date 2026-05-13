// ── Common password blacklist ──────────────────────────────────────────────
export const COMMON_PASSWORDS = new Set([
  'password','password1','password123','123456','12345678','123456789',
  'qwerty','qwerty123','abc123','letmein','monkey','dragon','master',
  'sunshine','princess','welcome','shadow','superman','michael','football',
  'baseball','batman','admin','login','hello','iloveyou','trustno1',
  'starwars','passw0rd','p@ssw0rd','pass123','secret','hunter2','qazwsx',
  'zxcvbn','test','test123',
]);

// ── Dictionary words to detect ────────────────────────────────────────────
const DICT_WORDS = [
  'love','hate','god','money','home','time','life','work','fish','bird',
  'wolf','bear','tiger','lion','fire','water','earth','wind','light','dark',
  'night','moon','star','sun','king','queen','hero','magic','power','code',
  'hack','root','apple','orange','game','team',
];

// ── Keyboard walk patterns ────────────────────────────────────────────────
const KEYBOARD_PATTERNS = ['qwerty','asdfgh','zxcvbn','123456','234567','345678','qazwsx'];

// ── Criteria definitions ──────────────────────────────────────────────────
export const CRITERIA = [
  { id: 'l8',  label: 'At least 8 characters',               weight: 1, test: p => p.length >= 8 },
  { id: 'l12', label: 'At least 12 characters (recommended)', weight: 2, test: p => p.length >= 12 },
  { id: 'up',  label: 'Contains uppercase (A–Z)',             weight: 1, test: p => /[A-Z]/.test(p) },
  { id: 'lo',  label: 'Contains lowercase (a–z)',             weight: 1, test: p => /[a-z]/.test(p) },
  { id: 'num', label: 'Contains number (0–9)',                weight: 1, test: p => /[0-9]/.test(p) },
  { id: 'sp',  label: 'Contains special character (!@#$…)',   weight: 2, test: p => /[^a-zA-Z0-9]/.test(p) },
  { id: 'nc',  label: 'Not a commonly used password',         weight: 2, test: p => !COMMON_PASSWORDS.has(p.toLowerCase()) },
  { id: 'nr',  label: 'No repeated character sequences',      weight: 1, test: p => !(/(.)\1{2,}/.test(p)) },
];

// ── Charset size ──────────────────────────────────────────────────────────
export function getCharsetSize(password) {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 32;
  return size || 1;
}

// ── Shannon entropy in bits ───────────────────────────────────────────────
export function calcEntropy(password) {
  if (!password) return 0;
  return Math.floor(password.length * Math.log2(getCharsetSize(password)));
}

// ── Entropy rating label + colour ─────────────────────────────────────────
export function getEntropyRating(bits) {
  if (bits < 28)  return { label: 'Critically Weak', color: 'var(--s1)' };
  if (bits < 36)  return { label: 'Weak',            color: 'var(--s2)' };
  if (bits < 50)  return { label: 'Moderate',        color: 'var(--s3)' };
  if (bits < 72)  return { label: 'Strong',          color: 'var(--s4)' };
  if (bits < 100) return { label: 'Very Strong',     color: 'var(--s5)' };
  return                  { label: 'Fortress',       color: 'var(--green)' };
}

// ── Human-readable crack time (10 billion guesses / second) ──────────────
export function getCrackTime(bits) {
  const seconds = Math.pow(2, bits) / 1e10 / 2;
  if (seconds < 1)        return 'Instantly';
  if (seconds < 60)       return `${Math.round(seconds)}s`;
  if (seconds < 3600)     return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400)    return `${Math.round(seconds / 3600)}h`;
  if (seconds < 2592000)  return `${Math.round(seconds / 86400)}d`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} mo`;
  if (seconds < 3.15e9)   return `${Math.round(seconds / 31536000)} yr`;
  if (seconds < 3.15e12)  return `${(seconds / 3.15e9).toFixed(1)}K yr`;
  return '∞';
}

// ── Dictionary attack risks ───────────────────────────────────────────────
export function getDictionaryRisks(password) {
  const lower = password.toLowerCase();
  const risks = [];

  if (COMMON_PASSWORDS.has(lower))
    risks.push({ severity: 'crit', message: 'One of the most commonly used passwords' });

  const foundWords = DICT_WORDS.filter(w => w.length >= 4 && lower.includes(w));
  if (foundWords.length)
    risks.push({ severity: foundWords.length >= 2 ? 'high' : 'med', message: `Contains common words: ${foundWords.slice(0, 3).join(', ')}` });

  const foundPatterns = KEYBOARD_PATTERNS.filter(k => lower.includes(k));
  if (foundPatterns.length)
    risks.push({ severity: 'med', message: `Keyboard pattern detected: "${foundPatterns[0]}"` });

  if (/(.)\1{2,}/.test(password))
    risks.push({ severity: 'low', message: 'Repeated characters detected' });

  if (/(?:012|123|234|345|456|567|678|789|abc|bcd)/i.test(password))
    risks.push({ severity: 'low', message: 'Sequential characters detected' });

  return risks;
}

// ── Dictionary resistance score 0–100 ────────────────────────────────────
export function getDictResistanceScore(password) {
  if (!password) return 0;
  const risks = getDictionaryRisks(password);
  const worst = risks.reduce((acc, r) => {
    const rank = { crit: 4, high: 3, med: 2, low: 1 }[r.severity] || 0;
    return rank > acc ? rank : acc;
  }, 0);
  return worst === 4 ? 0 : worst === 3 ? 25 : worst === 2 ? 55 : worst === 1 ? 75 : 100;
}

// ── Overall strength score 0–100 + label + colour ────────────────────────
export function calcStrength(password) {
  if (!password) return { score: 0, label: '', color: 'transparent' };

  const entropy    = calcEntropy(password);
  const dictScore  = getDictResistanceScore(password);
  const totalWeight = CRITERIA.reduce((a, c) => a + c.weight, 0);
  const passWeight  = CRITERIA.filter(c => c.test(password)).reduce((a, c) => a + c.weight, 0);

  const score = Math.round(
    Math.max(0, Math.min(100,
      Math.min((entropy / 100) * 100, 100) * 0.5 +
      (passWeight / totalWeight * 100)       * 0.3 +
      dictScore                              * 0.2
    ))
  );

  if (score < 20) return { score, label: 'Critically Weak', color: 'var(--s1)' };
  if (score < 40) return { score, label: 'Weak',            color: 'var(--s2)' };
  if (score < 60) return { score, label: 'Moderate',        color: 'var(--s3)' };
  if (score < 80) return { score, label: 'Strong',          color: 'var(--s4)' };
  return               { score, label: 'Very Strong',    color: 'var(--s5)' };
}
