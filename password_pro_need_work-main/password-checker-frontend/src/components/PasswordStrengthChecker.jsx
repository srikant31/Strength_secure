import { useMemo } from 'react';
import {
  calcStrength,
  calcEntropy,
  getCharsetSize,
  getEntropyRating,
  getCrackTime,
  getDictResistanceScore,
  getDictionaryRisks,
} from '../utils/passwordUtils';
import PasswordCriteria from './PasswordCriteria';
import styles from './PasswordStrengthChecker.module.css';

const SEGMENTS = 5;

const SEVERITY_CLASS = { crit: styles.rCrit, high: styles.rHigh, med: styles.rMed, low: styles.rLow };

export default function PasswordStrengthChecker({ password, showHistory = false, hideEntropy = false, hibpStatus = 'idle', hibpCount = 0 }) {
  const analysis = useMemo(() => {
    if (!password) return null;
    const str = calcStrength(password);
    const entropy = calcEntropy(password);
    const charsetSz = getCharsetSize(password);
    const entRating = getEntropyRating(entropy);
    const crackTime = getCrackTime(entropy);
    const dictScore = getDictResistanceScore(password);
    const dictRisks = getDictionaryRisks(password);

    const dictLabel = dictScore >= 90 ? 'Excellent'
      : dictScore >= 70 ? 'Good'
        : dictScore >= 50 ? 'Moderate'
          : dictScore >= 25 ? 'Poor'
            : 'Vulnerable';
    const dictColor = dictScore >= 90 ? 'var(--s5)'
      : dictScore >= 70 ? 'var(--s4)'
        : dictScore >= 50 ? 'var(--s3)'
          : dictScore >= 25 ? 'var(--s2)'
            : 'var(--s1)';

    return { str, entropy, charsetSz, entRating, crackTime, dictScore, dictRisks, dictLabel, dictColor };
  }, [password]);

  if (!password || !analysis) return null;

  const { str, entropy, charsetSz, entRating, crackTime, dictScore, dictRisks, dictLabel, dictColor } = analysis;
  const activeSegs = Math.ceil((str.score / 100) * SEGMENTS);

  return (
    <div className={styles.wrap}>
      {/* ── Strength bar ── */}
      <div className={styles.barRow}>
        <div className={styles.segs}>
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <div
              key={i}
              className={`${styles.seg} ${i < activeSegs ? styles.segOn : ''}`}
              style={i < activeSegs ? { background: str.color } : {}}
            />
          ))}
        </div>
        <span className={styles.barLabel} style={{ color: str.color }}>{str.label}</span>
        <span className={styles.score}>{str.score}<span>/100</span></span>
      </div>

      {/* ── Entropy gauge ── */}
      {!hideEntropy && (
        <div style={{ marginBottom: '16px' }}>
          {/* Gauge */}
          <div className={styles.gauge}>
            <div className={styles.gaugeHead}>
              <span className={styles.gaugeTitle}>Entropy</span>
              <span className={styles.gaugeVal} style={{ color: entRating.color }}>
                {entropy} bits — {entRating.label}
              </span>
            </div>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{ width: `${Math.min((entropy / 120) * 100, 100)}%`, background: entRating.color }}
              />
            </div>
            <div className={styles.ticks}><span>0</span><span>28</span><span>60</span><span>100</span><span>120+</span></div>
          </div>

          {/* Explainer card below */}
          <div style={{
            marginTop: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--t2, #aaa)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1, #fff)', marginBottom: 6 }}>
              What is Entropy?
            </div>
            <div style={{ marginBottom: 8 }}>
              Entropy measures how unpredictable your password is, measured in <strong style={{ color: 'var(--green, #00e5a0)' }}>bits</strong>.
            </div>

            <div style={{ 
              marginTop: 8, 
              fontSize: 14, 
              fontWeight: 600,
              color: 'var(--green, #00e5a0)',
              background: 'rgba(0, 229, 160, 0.1)',
              padding: '8px 12px',
              borderRadius: '6px',
              borderLeft: '4px solid var(--green, #00e5a0)'
            }}>
               Higher bits = harder to crack by brute force.
            </div>
          </div>
        </div>
      )}

      {/* ── Dictionary resistance ── */}
      <div className={styles.gauge}>
        <div className={styles.gaugeHead}>
          <span className={styles.gaugeTitle}>Dictionary Attack Resistance</span>
          <span className={styles.gaugeVal} style={{ color: dictColor }}>
            {dictScore}% — {dictLabel}
          </span>
        </div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${dictScore}%`, background: dictColor }} />
        </div>
        {dictRisks.length > 0
          ? dictRisks.map((r, i) => (
            <div key={i} className={`${styles.risk} ${SEVERITY_CLASS[r.severity]}`}>
              <span>{r.message}</span>
            </div>
          ))
          : <div className={`${styles.risk} ${styles.rOk}`}>✓ No dictionary vulnerabilities detected</div>
        }
      </div>

      {/* ── Criteria checklist ── */}
      <PasswordCriteria password={password} hibpStatus={hibpStatus} hibpCount={hibpCount} />
    </div>
  );
}
