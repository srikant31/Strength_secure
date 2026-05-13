import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './AuthPage.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email is required.');
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await axios.post('/api/auth/forgot-password', { email: email.trim() });
      setMessage(res.data.message || 'If an account exists, a reset link has been sent to your email.');
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to request password reset. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className={styles.box} style={{ padding: '40px', maxWidth: '400px', width: '100%', margin: 'auto' }}>
        <div>
          <h3 className={styles.title}>Reset Password</h3>
          <p className={styles.sub}>Enter your email to receive a recovery link.</p>
        </div>

        {error && <div className="alert alert-err" style={{ marginTop: '20px' }}>{error}</div>}
        {message && <div className="alert alert-ok" style={{ marginTop: '20px' }}>{message}</div>}

        <form className="form-stack" onSubmit={submit} noValidate style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label className="flabel">Account Email</label>
            <input
              name="email" type="email" className="inp" placeholder="you@example.com"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" /> Sending...</> : 'Send Recovery Link'}
          </button>
        </form>

        <p className={styles.footer} Style={{ marginTop: '30px' }}>
          Remembered it? <Link to="/login" className={styles.link}>Sign in instead</Link>
        </p>
      </div>
    </div>
  );
}
