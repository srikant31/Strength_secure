import { CRITERIA } from '../utils/passwordUtils';
import styles from './PasswordCriteria.module.css';

export default function PasswordCriteria({ password, hibpStatus = 'idle', hibpCount = 0 }) {
  if (!password) return null;

  // HIBP row config
  const hibpChecking = hibpStatus === 'checking';
  const hibpSafe     = hibpStatus === 'safe';
  const hibpBreached = hibpStatus === 'breached';

  let hibpIcon  = '⟳';
  let hibpClass = `${styles.item}`;
  let hibpLabel = 'Checking breach database…';

  if (hibpSafe) {
    hibpIcon  = '✓';
    hibpClass = `${styles.item} ${styles.pass}`;
    hibpLabel = 'Not found in any known data breaches';
  } else if (hibpBreached) {
    hibpIcon  = '×';
    hibpClass = `${styles.item} ${styles.fail}`;
    hibpLabel = `Found in ${hibpCount.toLocaleString()} known data breach${hibpCount !== 1 ? 'es' : ''} — choose a different password`;
  }

  return (
    <div className={styles.criteria}>
      <div className={styles.header}>// REQUIREMENTS </div>
      <ul className={styles.list}>
        {CRITERIA.map(c => {
          const pass = c.test(password);
          return (
            <li key={c.id} className={`${styles.item} ${pass ? styles.pass : styles.fail}`}>
              <span className={styles.icon}>{pass ? '✓' : '×'}</span>
              <span style={{ flex: 1 }}>{c.label}</span>
            </li>
          );
        })}

        {/* HIBP live check row — only show once we have a password long enough to check */}
        {hibpStatus !== 'idle' && (
          <li className={hibpClass}
            style={hibpChecking ? { opacity: 0.65 } : {}}>
            <span
              className={styles.icon}
              style={hibpChecking ? { display: 'inline-block', animation: 'spin 0.9s linear infinite' } : {}}>
              {hibpIcon}
            </span>
            <span style={{ flex: 1 }}>{hibpLabel}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
