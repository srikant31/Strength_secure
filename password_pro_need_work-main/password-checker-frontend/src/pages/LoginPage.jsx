import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

export default function LoginPage() {
  const { login, verifyOtp } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  

  const [otpPhase, setOtpPhase] = useState(false);
  const [otp, setOtp] = useState('');

  const onChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };


  const submitPassword = async () => {
    try {
      const data = await login(form.email.trim(), form.password);
      if (data?.requireOtp) {
        setOtpPhase(true);
        setError('');
      } else {
        navigate('/dashboard');
      }
    } catch (ex) {
      const msg = ex.response?.data?.message || ex.message || 'Login failed.';
      setError(msg);

    }
  };

  const submitOtp = async () => {
    try {
      await verifyOtp(form.email.trim(), otp);
      navigate('/dashboard');
    } catch (ex) {
      setError(ex.response?.data?.message || ex.message || 'OTP verification failed.');
    }
  };

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (otpPhase) {
      await submitOtp();
    } else {
      await submitPassword();
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.wrap}>
      <aside className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}><ShieldIcon /></div>
          <span className={styles.brandName}>SecureVault</span>
        </div>
        <div>
          <h2 className={styles.tagline}>Login</h2>
          <p className={styles.taglineSub}>Please sign in to continue.</p>
        </div>
        <div className={styles.scanlines} />
      </aside>

      <div className={styles.right}>
        <div className={styles.box}>
          <div>
            <h3 className={styles.title}>{otpPhase ? 'Two-Factor Authentication' : 'Sign In'}</h3>
            <p className={styles.sub}>
              {otpPhase ? 'Check your email for the OTP' : <>No account? <Link to="/register" className={styles.link}>Register →</Link></>}
            </p>
          </div>

          {error && <div className="alert alert-err">{error}</div>}

          <form className="form-stack" onSubmit={submit} noValidate>
            
            {/* OTP Phase */}
            {otpPhase ? (
              <div className="form-group">
                <label className="flabel">6-Digit OTP</label>
                <input
                  name="otp" type="text" className="inp" placeholder="XXXXXX"
                  value={otp} onChange={e => { setOtp(e.target.value); setError(''); }} 
                  maxLength={6} required
                  style={{ letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.2rem' }}
                />
              </div>
            ) : (
              /* Password Phase */
              <>
                <div className="form-group">
                  <label className="flabel">Email</label>
                  <input
                    name="email" type="email" className="inp" placeholder="you@example.com"
                    value={form.email} onChange={onChange} required
                  />
                </div>
                <div className="form-group">
                  <label className="flabel">Password</label>
                  <div className="input-wrap">
                    <input
                      name="password" type={showPw ? 'text' : 'password'}
                      className="inp has-icon" placeholder="Enter your password"
                      value={form.password} onChange={onChange} required
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowPw(p => !p)}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '8px' }}>
                    <Link to="/forgot-password" className={styles.link} style={{ fontSize: '12px' }}>
                      Forgot your password?
                    </Link>
                  </div>
                </div>

              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Authenticating…</> : (otpPhase ? 'Verify OTP →' : 'Sign In →')}
            </button>
            
            {otpPhase && (
              <button type="button" className="btn btn-ghost" onClick={() => setOtpPhase(false)} style={{ marginTop: '0.5rem' }}>
                ← Back to Login
              </button>
            )}
          </form>

          {!otpPhase && (
            <>
              <div className="divider">OR</div>
              <p className={styles.demoNote}>
                First register an account, then come back here to sign in.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
