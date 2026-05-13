import { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { calcStrength } from '../utils/passwordUtils';
import PasswordStrengthChecker from '../components/PasswordStrengthChecker';
import styles from './DashboardPage.module.css';

/* ── Shared icons ─────────────────────────────────────────────────────────── */
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
      <path d="M16 2L4 8v8c0 7.7 5.2 14.9 12 17 6.8-2.1 12-9.3 12-17V8L16 2z"
        fill="rgba(0,229,160,.15)" stroke="var(--green)" strokeWidth="1.5" />
      <path d="M12 16l3 3 5-6" stroke="var(--green)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ── Static data ──────────────────────────────────────────────────────────── */
const SECURITY_TIPS = [
  { title: 'Length matters most',    body: 'A 16-character password is exponentially harder to crack than an 8-character one. Aim for 16+ characters.' },
  { title: 'Use a passphrase',       body: 'Combine 4–5 random unrelated words like "cobalt-mango-eclipse-radio" for memorable high-entropy passwords.' },
  { title: 'Never reuse passwords',  body: 'If one site is breached, attackers use credential stuffing to access all your other accounts.' },
  { title: 'Enable 2FA everywhere',  body: 'Two-factor authentication makes passwords alone worthless. Even weak passwords become much safer with 2FA.' },
  { title: 'Use a password manager', body: 'Tools like Bitwarden, 1Password, or KeePassXC generate and store unique strong passwords for every site.' },
  { title: 'Rotate after breaches',  body: 'Check haveibeenpwned.com regularly. Change any password appearing in a known data breach immediately.' },
];

const NAV = [
  { id: 'checker',  label: 'Password Checker' },
  { id: 'vault',    label: 'My Vault'          },
  { id: 'history',  label: 'Password History'  },
  { id: 'security', label: 'Security Tips'     },
  { id: 'change',   label: 'Change Password'   },
];

/* ── Change-password sub-form ─────────────────────────────────────────────── */
function ChangePasswordForm() {
  const [form, setForm]   = useState({ currentPassword: '', newPassword: '', confirmNew: '' });
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCnf, setShowCnf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const str      = calcStrength(form.newPassword);
  const weak     = form.newPassword.length > 0 && str.score < 40;
  const mismatch = form.confirmNew.length > 0 && form.newPassword !== form.confirmNew;

  const onChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const submit = async e => {
    e.preventDefault();
    if (weak)     return setError('New password is too weak (score ≥ 40 required).');
    if (mismatch) return setError('New passwords do not match.');
    if (!form.currentPassword) return setError('Current password is required.');

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setSuccess('Password updated successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmNew: '' });
    } catch (ex) {
      setError(ex.response?.data?.message || ex.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <p className={styles.changeNote}>
        Your new password must score at least <strong style={{ color: 'var(--green)' }}>Moderate (40/100)</strong> to be accepted.
        Passwords are hashed with bcrypt and previous passwords cannot be reused.
      </p>

      {error   && <div className="alert alert-err">{error}</div>}
      {success && <div className="alert alert-ok">{success}</div>}

      <form className="form-stack" onSubmit={submit} noValidate style={{ marginTop: 4 }}>
        {/* Current password */}
        <div className="form-group">
          <label className="flabel">Current Password <span className="freq">*</span></label>
          <div className="input-wrap">
            <input
              name="currentPassword" type={showCur ? 'text' : 'password'}
              className="inp has-icon" placeholder="Your current password"
              value={form.currentPassword} onChange={onChange} required
            />
            <button type="button" className="eye-btn" onClick={() => setShowCur(p => !p)}>
              <EyeIcon open={showCur} />
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="form-group">
          <label className="flabel">
            New Password <span className="freq">*</span>
            {form.newPassword.length > 0 && (
              <span className="lbadge" style={{
                background: `${str.color}18`, color: str.color,
                border: `1px solid ${str.color}33`,
              }}>
                {str.label} · {str.score}/100
              </span>
            )}
          </label>
          <div className="input-wrap">
            <input
              name="newPassword" type={showNew ? 'text' : 'password'}
              className={`inp has-icon${weak ? ' weak' : ''}`}
              placeholder="Create a strong new password"
              value={form.newPassword} onChange={onChange} required
            />
            <button type="button" className="eye-btn" onClick={() => setShowNew(p => !p)}>
              <EyeIcon open={showNew} />
            </button>
          </div>
          {form.newPassword.length > 0 && (
            <PasswordStrengthChecker password={form.newPassword} showHistory />
          )}
        </div>

        {/* Confirm new password */}
        <div className="form-group">
          <label className="flabel">Confirm New Password <span className="freq">*</span></label>
          <div className="input-wrap">
            <input
              name="confirmNew" type={showCnf ? 'text' : 'password'}
              className={`inp has-icon${mismatch ? ' error' : ''}`}
              placeholder="Repeat your new password"
              value={form.confirmNew} onChange={onChange} required
            />
            <button type="button" className="eye-btn" onClick={() => setShowCnf(p => !p)}>
              <EyeIcon open={showCnf} />
            </button>
          </div>
          {mismatch && <p className="ferr">Passwords do not match</p>}
          {!mismatch && form.confirmNew.length > 0 && form.newPassword === form.confirmNew && (
            <p className="fok">Passwords match</p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || weak || mismatch || !form.currentPassword || !form.newPassword}
        >
          {loading ? <><span className="spinner" /> Updating password…</> : 'Update Password →'}
        </button>
      </form>
    </div>
  );
}

/* ── History tab ─────────────────────────────────────────────────────────── */
function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users/history');
      setHistory(data.history || []);
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className={styles.card} style={{ textAlign: 'center', color: 'var(--t2)', padding: '36px 20px' }}>
      <span className="spinner" style={{ marginRight: 8 }} /> Loading history…
    </div>
  );

  if (error) return (
    <div className={styles.card}>
      <div className="alert alert-err">{error}</div>
    </div>
  );

  return (
    <div className={styles.card}>
      {history.length === 0 ? (
        <div className={styles.empty}>
          <p>No password history yet. History is recorded each time you update your password.</p>
        </div>
      ) : (
        <div className={styles.histList}>
          {history.map((h, i) => (
            <div key={i} className={styles.histItem}>
              <span className={styles.histRank}>#{h.rank}</span>
              <span className={styles.histPw} title="Hash preview (not the actual password)">
                {h.hashPreview}
              </span>
              <span className={styles.histBadge}>bcrypt</span>
              <span className={styles.histDate}>
                {new Date(h.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className={styles.histNote}>
        Previous passwords stored as bcrypt hashes only — never logged or retrievable,
        only used to detect and prevent reuse. Showing hash preview (first 12 chars).
      </p>
    </div>
  );
}

/* ── Vault Tab ──────────────────────────────────────────────────────────── */
function VaultTab() {
  const [vault,    setVault]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');
  const [showAdd,  setShowAdd] = useState(false);
  const [saving,   setSaving]  = useState(false);
  const [form,     setForm]    = useState({ siteName: '', password: '', notes: '' });
  const [revealed, setRevealed] = useState({});   // { [id]: bool }
  const [copied,   setCopied]   = useState({});   // { [id]: bool }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/vault');
      setVault(data.vault || []);
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to load vault.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleReveal = id =>
    setRevealed(r => ({ ...r, [id]: !r[id] }));

  const copyPw = async (id, pw) => {
    await navigator.clipboard.writeText(pw);
    setCopied(c => ({ ...c, [id]: true }));
    setTimeout(() => setCopied(c => ({ ...c, [id]: false })), 1500);
  };

  const deleteEntry = async id => {
    if (!window.confirm('Delete this saved password?')) return;
    try {
      await api.delete(`/vault/${id}`);
      setVault(v => v.filter(e => e._id !== id));
    } catch (ex) {
      setError(ex.response?.data?.message || 'Delete failed.');
    }
  };

  const addEntry = async e => {
    e.preventDefault();
    if (!form.siteName.trim() || !form.password) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/vault', form);
      setVault(v => [data.entry, ...v]);
      setForm({ siteName: '', password: '', notes: '' });
      setShowAdd(false);
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // Pick an emoji icon based on site name
  const siteIcon = name => {
    const n = name.toLowerCase();
    if (n.includes('gmail') || n.includes('email') || n.includes('mail')) return '📧';
    if (n.includes('github') || n.includes('git'))  return '🐙';
    if (n.includes('google'))   return '🔍';
    if (n.includes('facebook') || n.includes('fb')) return '📘';
    if (n.includes('twitter') || n.includes('x.com')) return '🐦';
    if (n.includes('instagram')) return '📸';
    if (n.includes('bank') || n.includes('pay') || n.includes('finance')) return '🏦';
    if (n.includes('netflix') || n.includes('youtube') || n.includes('amazon')) return '🎬';
    if (n.includes('work') || n.includes('office') || n.includes('slack')) return '💼';
    if (n.includes('shop') || n.includes('store')) return '🛒';
    return '🔑';
  };

  if (loading) return (
    <div className={styles.card} style={{ textAlign: 'center', color: 'var(--t2)', padding: '36px 20px' }}>
      <span className="spinner" style={{ marginRight: 8 }} /> Loading vault…
    </div>
  );

  return (
    <div className={styles.vaultWrap}>
      {error && <div className="alert alert-err">{error}</div>}

      {/* Top bar */}
      <div className={styles.vaultTopBar}>
        <span className={styles.vaultCount}>
          {vault.length} saved password{vault.length !== 1 ? 's' : ''}
        </span>
        <button className={styles.addBtn} onClick={() => setShowAdd(s => !s)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showAdd ? 'Cancel' : 'Add Password'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form className={styles.addForm} onSubmit={addEntry} noValidate>
          <div className={styles.addFormTitle}>+ Save a new password</div>
          <div className={styles.addFormRow}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="flabel">Site / Service <span className="freq">*</span></label>
              <input
                className="inp"
                placeholder="e.g. Gmail, GitHub, Netflix"
                value={form.siteName}
                onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="flabel">Password <span className="freq">*</span></label>
              <input
                className="inp"
                placeholder="Password for this site"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="flabel">Notes <span style={{ color: 'var(--t3)', fontWeight: 400 }}>(optional)</span></label>
            <input
              className="inp"
              placeholder="e.g. Personal account, 2FA enabled"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className={styles.addFormActions}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !form.siteName.trim() || !form.password}>
              {saving ? <><span className="spinner" /> Saving…</> : 'Save →'}
            </button>
          </div>
        </form>
      )}

      {/* Vault list */}
      {vault.length === 0 && !showAdd ? (
        <div className={styles.card}>
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔒</span>
            <p>No saved passwords yet. Click <strong>Add Password</strong> to get started.</p>
          </div>
        </div>
      ) : (
        <div className={styles.vaultList}>
          {vault.map(entry => (
            <div key={entry._id} className={styles.vaultEntry}>
              {/* Icon */}
              <div className={styles.vaultSiteIcon}>{siteIcon(entry.siteName)}</div>

              {/* Info */}
              <div className={styles.vaultEntryInfo}>
                <div className={styles.vaultSiteName}>{entry.siteName}</div>
                <div className={styles.vaultPwRow}>
                  <span className={styles.vaultPw}>
                    {revealed[entry._id] ? entry.password : '•'.repeat(Math.min(entry.password.length, 18))}
                  </span>
                  {/* reveal toggle */}
                  <button className={styles.eyeSmall} onClick={() => toggleReveal(entry._id)} title={revealed[entry._id] ? 'Hide' : 'Show password'}>
                    <EyeIcon open={revealed[entry._id]} />
                  </button>
                  {/* copy */}
                  <button className={styles.copyBtn} onClick={() => copyPw(entry._id, entry.password)} title="Copy password">
                    {copied[entry._id] ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                    {copied[entry._id] ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {entry.notes && <div className={styles.vaultNotes}>{entry.notes}</div>}
              </div>

              {/* Date */}
              <div className={styles.vaultEntryDate}>
                {new Date(entry.createdAt).toLocaleDateString()}
              </div>

              {/* Delete */}
              <button className={styles.deleteBtn} onClick={() => deleteEntry(entry._id)} title="Delete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.vaultNote}>
        🔐 Passwords are stored as plain text so you can view them. This vault is private to your account and protected by your JWT session.
      </div>
    </div>
  );
}

/* ── Breach Center Tab ───────────────────────────────────────────────────── */
function BreachCenterTab() {
  // Email checker state
  const [email,        setEmail]        = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult,  setEmailResult]  = useState(null);  // { breaches, safe } | { noKey } | { error }

  // Password checker state
  const [pw,        setPw]        = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwResult,  setPwResult]  = useState(null);  // { count, breached } | { error }

  /* ── Email check ── */
  const checkEmail = async e => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailLoading(true);
    setEmailResult(null);
    try {
      const { data } = await api.get(`/users/check-email?email=${encodeURIComponent(email.trim())}`);
      setEmailResult(data);
    } catch (ex) {
      setEmailResult({ error: ex.response?.data?.message || 'Check failed. Try again.' });
    } finally {
      setEmailLoading(false);
    }
  };

  /* ── Password check ── */
  const checkPw = async e => {
    e.preventDefault();
    if (!pw) return;
    setPwLoading(true);
    setPwResult(null);
    try {
      const { data } = await api.get(`/users/check-password?password=${encodeURIComponent(pw)}`);
      setPwResult(data);
    } catch (ex) {
      setPwResult({ error: ex.response?.data?.message || 'Check failed. Try again.' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className={styles.securityWrap}>

      {/* ── Two checker panels ── */}
      <div className={styles.breachPanels}>

        {/* Email panel */}
        <div className={styles.breachPanel}>
          <div className={styles.breachPanelHead}>
            <div className={styles.breachPanelTitle}>
              <span>📧</span> Email Breach Check
            </div>
            <div className={styles.breachPanelSub}>
              See if your email has appeared in any known data breaches via XposedOrNot (free, no API key needed).
            </div>
          </div>

          <form onSubmit={checkEmail} noValidate>
            <div className={styles.breachInputRow}>
              <input
                className="inp"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailResult(null); }}
                required
              />
              <button className={styles.checkBtn} type="submit" disabled={emailLoading || !email.trim()}>
                {emailLoading ? <><span className="spinner" /></> : 'Check →'}
              </button>
            </div>
          </form>

          {/* Email result */}
          {emailResult && (
            <>
              {emailResult.error && (
                <div className="alert alert-err">{emailResult.error}</div>
              )}

              {emailResult.safe && (
                <div className={styles.breachSafe}>
                  ✅ Good news! <strong>{email}</strong> was not found in any known breaches.
                </div>
              )}

              {emailResult.breaches && emailResult.breaches.length > 0 && (
                <div className={styles.breachFound}>
                  <div className={styles.breachFoundHeader}>
                    ⚠️ Found in {emailResult.breaches.length} breach{emailResult.breaches.length !== 1 ? 'es' : ''}
                    <span className={styles.breachCount}>{email}</span>
                  </div>
                  <div className={styles.breachList}>
                    {emailResult.breaches.map(siteName => (
                      <div key={siteName} className={styles.breachCard}>
                        <div className={styles.breachCardTop}>
                          <span className={styles.breachName}>{siteName}</span>
                          <span className={styles.breachTag} style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>breached</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Password panel */}
        <div className={styles.breachPanel}>
          <div className={styles.breachPanelHead}>
            <div className={styles.breachPanelTitle}>
              <span>🔑</span> Password Breach Check
            </div>
            <div className={styles.breachPanelSub}>
              Check if a password has appeared in breach databases. Uses k-Anonymity — your password is never sent in full.
            </div>
          </div>

          <form onSubmit={checkPw} noValidate>
            <div className={styles.breachInputRow}>
              <div className="input-wrap" style={{ flex: 1 }}>
                <input
                  className="inp has-icon"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter a password to check"
                  value={pw}
                  onChange={e => { setPw(e.target.value); setPwResult(null); }}
                  autoComplete="new-password"
                />
                <button type="button" className="eye-btn" onClick={() => setShowPw(p => !p)}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
              <button className={styles.checkBtn} type="submit" disabled={pwLoading || !pw}>
                {pwLoading ? <><span className="spinner" /></> : 'Check →'}
              </button>
            </div>
          </form>

          {/* Password result */}
          {pwResult && (
            <div className={styles.pwBreachResult}>
              {pwResult.error && <div className="alert alert-err">{pwResult.error}</div>}

              {pwResult.breached === false && (
                <div className={styles.breachSafe}>
                  ✅ This password has <strong>never appeared</strong> in any known data breaches.
                </div>
              )}

              {pwResult.breached === true && (
                <div className={styles.pwBreachCount}>
                  <div>
                    <div className={styles.pwBreachBig}>
                      {pwResult.count.toLocaleString()}×
                    </div>
                  </div>
                  <div className={styles.pwBreachLabel}>
                    <strong style={{ color: '#ef4444' }}>Breached password!</strong><br />
                    This exact password has been seen <strong>{pwResult.count.toLocaleString()} times</strong> in known data breaches. Do not use it anywhere.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tips grid below ── */}
      <div>
        <div style={{ fontFamily: 'var(--disp)', fontSize: 14, fontWeight: 800, marginBottom: 12, color: 'var(--t2)' }}>
          Security Best Practices
        </div>
        <div className={styles.tipGrid}>
          {SECURITY_TIPS.map(t => (
            <div key={t.title} className={styles.tipCard}>
              <div className={styles.tipTitle}>{t.title}</div>
              <div className={styles.tipBody}>{t.body}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [tab,    setTab]    = useState('checker');
  const [testPw, setTestPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setShowSessionModal(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const continueSession = () => {
    setShowSessionModal(false);
    setTimeLeft(60);
  };

  const terminateSession = () => {
    setShowSessionModal(false);
    logout();
  };

  const str = calcStrength(testPw);

  const tabMeta = {
    checker:  { title: 'Password Strength Analyzer', sub: 'Test any password for entropy, dictionary resistance & security score' },
    vault:    { title: 'My Password Vault',           sub: 'Securely store and view your passwords for different sites & services' },
    history:  { title: 'Password History',            sub: 'Your past password hashes — used only to prevent reuse' },
    security: { title: 'Breach Center',               sub: 'Check if your email or password has appeared in a known data breach' },
    change:   { title: 'Change Password',             sub: 'Update your account password with strength enforcement' },
  };

  return (
    <div className={styles.wrap}>
      {/* ── Session Expiry Modal ── */}
      {showSessionModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--surface, #1a1d2e)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '40px 36px', maxWidth: 420, width: '90%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--t1, #fff)' }}>
              Session Expired
            </h3>
            <p style={{ margin: '0 0 28px', color: 'var(--t2, #aaa)', fontSize: 14, lineHeight: 1.6 }}>
              Your secure session has timed out due to inactivity.<br />
              Would you like to continue your session or sign out?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={terminateSession}
                style={{
                  padding: '10px 22px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)',
                  background: 'rgba(239,68,68,0.08)', color: '#f87171',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              >
                Terminate Session
              </button>
              <button
                onClick={continueSession}
                style={{
                  padding: '10px 22px', borderRadius: 8, border: '1px solid rgba(0,229,160,0.4)',
                  background: 'rgba(0,229,160,0.12)', color: 'var(--green, #00e5a0)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,229,160,0.22)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(0,229,160,0.12)'}
              >
                Continue Session +1 min →
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}><ShieldIcon /> SecureVault</div>

        <nav className={styles.nav}>
          {NAV.map(n => (
            <button
              key={n.id}
              className={`${styles.navBtn} ${tab === n.id ? styles.navActive : ''}`}
              onClick={() => setTab(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className={styles.foot}>
          <div className={styles.userRow}>
            <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase() || 'U'}</div>
            <div>
              <div className={styles.uname}>{user?.username}</div>
              <div className={styles.uemail}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{tabMeta[tab].title}</h2>
            <p className={styles.sub}>{tabMeta[tab].sub}</p>
          </div>
          <button className="badge badge-green" style={{ cursor: 'default', background: timeLeft < 10 ? '#ef444422' : undefined, color: timeLeft < 10 ? '#ef4444' : undefined, borderColor: timeLeft < 10 ? '#ef444444' : undefined }}>
            <span style={{ fontSize: 8 }}>●</span> Secure Session ({Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')})
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* ── Checker tab ── */}
          {tab === 'checker' && (
            <div className={styles.card}>
              <div className="form-group">
                <label className="flabel">
                  Analyze a password
                  {testPw.length > 0 && (
                    <span className="lbadge" style={{
                      background: `${str.color}18`, color: str.color,
                      border: `1px solid ${str.color}33`,
                    }}>
                      {str.label} · {str.score}/100
                    </span>
                  )}
                </label>
                <div className="input-wrap">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="inp has-icon"
                    placeholder="Type any password to analyze…"
                    value={testPw}
                    onChange={e => setTestPw(e.target.value)}
                    autoComplete="off"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPw(p => !p)}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>
              {testPw.length > 0
                ? <div style={{ marginTop: 14 }}>
                    <PasswordStrengthChecker password={testPw} showHistory />
                  </div>
                : <div className={styles.empty}>
                    <p>Type a password above to see the full security analysis.</p>
                  </div>
              }
            </div>
          )}

          {/* ── Vault tab ── */}
          {tab === 'vault' && <VaultTab />}

          {/* ── History tab ── */}
          {tab === 'history' && <HistoryTab />}

          {/* ── Security / Breach Center tab ── */}
          {tab === 'security' && <BreachCenterTab />}

          {/* ── Change password tab ── */}
          {tab === 'change' && <ChangePasswordForm />}

        </div>
      </main>
    </div>
  );
}
