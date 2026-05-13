import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { calcStrength } from '../utils/passwordUtils';
import { useHibpCheck } from '../utils/useHibpCheck';
import PasswordStrengthChecker from '../components/PasswordStrengthChecker';
import styles from './AuthPage.module.css';

function ShieldIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
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

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const str  = calcStrength(form.password);
  const weak = form.password.length > 0 && str.score < 40;
  const mismatch = form.confirm.length > 0 && form.password !== form.confirm;

  // Real-time HIBP breach check
  const { status: hibpStatus, count: hibpCount } = useHibpCheck(form.password);
  const breached = hibpStatus === 'breached';

  const onChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.username.trim()) return setError('Username is required.');
    if (weak)     return setError('Please choose a stronger password (score ≥ 40).');
    if (mismatch) return setError('Passwords do not match.');
    if (breached) return setError('This password has appeared in a data breach. Please choose a different one.');
    setLoading(true);
    setError('');
    try {
      await register(form.username.trim(), form.email.trim(), form.password);
      navigate('/dashboard');
    } catch (ex) {
      setError(ex.response?.data?.message || ex.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      {/* ── Left panel ── */}
      <aside className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}><ShieldIcon /></div>
          <span className={styles.brandName}>SecureVault</span>
        </div>
        <div>
          <h2 className={styles.tagline}>
            Register
          </h2>
          <p className={styles.taglineSub}>
            Create an account to continue.
          </p>
        </div>
        
        <div style={{ marginTop: '3rem', maxWidth: '350px', zIndex: 2, position: 'relative' }}>
          {form.password.length > 0 ? (
            <>
              <h3 style={{ color: 'var(--text-alt)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                Password Analysis
              </h3>
              <PasswordStrengthChecker password={form.password} showHistory hideEntropy hibpStatus={hibpStatus} hibpCount={hibpCount} />
            </>
          ) : (
            <div className={styles.featList}>
              <div className={styles.featItem}>
                <span className={styles.featIcon}>🛡️</span>
                <div>
                  <div className={styles.featLabel}>Military-Grade Vault</div>
                  <div className={styles.featDesc}>Your credentials are mathematically evaluated and salted using advanced Argon2 hashing.</div>
                </div>
              </div>
              <div className={styles.featItem}>
                <span className={styles.featIcon}>🔐</span>
                <div>
                  <div className={styles.featLabel}>Your Password Hub</div>
                  <div className={styles.featDesc}>One-stop place for storing your passwords and learning to be safer online. Protect and recover your account by storing your passwords in case you forget them.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.scanlines} />
      </aside>

      {/* ── Right panel (form) ── */}
      <div className={styles.right}>
        <div className={styles.box}>
          <div>
            <h3 className={styles.title}>Create Account</h3>
            <p className={styles.sub}>
              Already registered? <Link to="/login" className={styles.link}>Sign in →</Link>
            </p>
          </div>

          {error && <div className="alert alert-err">{error}</div>}

          <form className="form-stack" onSubmit={submit} noValidate>
            {/* Username */}
            <div className="form-group">
              <label className="flabel">Username <span className="freq">*</span></label>
              <input
                name="username" className="inp" placeholder="e.g. cipher_knight"
                value={form.username} onChange={onChange} required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="flabel">Email <span className="freq">*</span></label>
              <input
                name="email" type="email" className="inp" placeholder="you@example.com"
                value={form.email} onChange={onChange} required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="flabel">
                Password <span className="freq">*</span>
                {form.password.length > 0 && (
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
                  name="password" type={showPw ? 'text' : 'password'}
                  className={`inp has-icon${weak ? ' weak' : ''}`}
                  placeholder="Create a strong password"
                  value={form.password} onChange={onChange} required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPw(p => !p)}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <label className="flabel">Confirm Password <span className="freq">*</span></label>
              <div className="input-wrap">
                <input
                  name="confirm" type={showCf ? 'text' : 'password'}
                  className={`inp has-icon${mismatch ? ' error' : ''}`}
                  placeholder="Repeat your password"
                  value={form.confirm} onChange={onChange} required
                />
                <button type="button" className="eye-btn" onClick={() => setShowCf(p => !p)}>
                  <EyeIcon open={showCf} />
                </button>
              </div>
              {mismatch && <p className="ferr">Passwords do not match</p>}
              {!mismatch && form.confirm.length > 0 && form.password === form.confirm && (
                <p className="fok">Passwords match</p>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || weak || mismatch || breached || hibpStatus === 'checking'}>
              {loading ? <><span className="spinner" /> Creating account…</> : 'Create Secure Account →'}
            </button>
          </form>

          <p className={styles.footer}>
            Passwords are mathematically secured using Argon2id hashing and never stored in plaintext.
          </p>
        </div>
      </div>
    </div>
  );
}
