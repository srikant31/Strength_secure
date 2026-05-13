import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { calcStrength } from '../utils/passwordUtils';
import PasswordStrengthChecker from '../components/PasswordStrengthChecker';
import styles from './AuthPage.module.css';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const str = calcStrength(form.password);
  const weak = form.password.length > 0 && str.score < 40;
  const mismatch = form.confirm.length > 0 && form.password !== form.confirm;

  const onChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const submit = async e => {
    e.preventDefault();
    if (weak) return setError('Please choose a stronger password (score ≥ 40).');
    if (mismatch) return setError('Passwords do not match.');
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`/api/auth/reset-password/${token}`, { password: form.password });
      setSuccess(res.data.message || 'Password successfully reset.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to reset password. The link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.wrap} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className={styles.box} style={{ padding: '40px', maxWidth: '400px', width: '100%', margin: 'auto', textAlign: 'center' }}>
          <h3 className={styles.title} style={{ color: 'var(--green)' }}>Success</h3>
          <p className={styles.sub} style={{ marginTop: '10px' }}>{success}</p>
          <p className={styles.sub} style={{ marginTop: '20px' }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: '32px', width: '100%', maxWidth: '900px', alignItems: 'flex-start' }}>

        {/* ── Left: Form ── */}
        <div className={styles.box} style={{ padding: '40px', flex: '0 0 400px' }}>
          <div>
            <h3 className={styles.title}>Create New Password</h3>
            <p className={styles.sub}>Enter your new secure password below to regain access.</p>
          </div>

          {error && <div className="alert alert-err" style={{ marginTop: '20px' }}>{error}</div>}

          <form className="form-stack" onSubmit={submit} noValidate style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="flabel">New Password</label>
              <div className="input-wrap">
                <input
                  name="password" type={showPw ? 'text' : 'password'}
                  className={`inp has-icon${weak ? ' weak' : ''}`}
                  placeholder="Create a strong password"
                  value={form.password} onChange={onChange} required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPw(p => !p)}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="flabel">Confirm Password</label>
              <div className="input-wrap">
                <input
                  name="confirm" type={showPw ? 'text' : 'password'}
                  className={`inp has-icon${mismatch ? ' error' : ''}`}
                  placeholder="Repeat your new password"
                  value={form.confirm} onChange={onChange} required
                />
              </div>
              {mismatch && <p className="ferr">Passwords do not match</p>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || weak || mismatch}>
              {loading ? <><span className="spinner" /> Resetting...</> : 'Secure My Account'}
            </button>
          </form>
        </div>

        {/* ── Right: Strength Checker (appears when typing) ── */}
        {form.password.length > 0 && (
          <div style={{ flex: 1, paddingTop: '12px' }}>
            <PasswordStrengthChecker password={form.password} />
          </div>
        )}

      </div>
    </div>
  );

}
