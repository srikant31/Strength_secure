import styles from './EntropyExplainer.module.css';

const SCALE = [
  { bits: '< 28',   desc: 'Instantly cracked',        color: 'var(--s1)', width: 12  },
  { bits: '28–36',  desc: 'Seconds–minutes',           color: 'var(--s2)', width: 28  },
  { bits: '36–60',  desc: 'Hours–months',              color: 'var(--s3)', width: 50  },
  { bits: '60–100', desc: 'Years–centuries',           color: 'var(--s4)', width: 75  },
  { bits: '100+',   desc: 'Computationally secure',    color: 'var(--s5)', width: 100 },
];

const LEGEND = [
  { cls: styles.fe, var: 'E', desc: '= Entropy in bits' },
  { cls: styles.fl, var: 'L', desc: '= Password length' },
  { cls: styles.fr, var: 'R', desc: '= Charset size (a–z=26, +A–Z=52, +0–9=62, +symbols=94)' },
];

export default function EntropyExplainer({ entropy, charsetSize, crackTime }) {
  return (
    <div className={styles.wrap}>
      {/* Live stats row */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.val}>{entropy ?? 0}</span>
          <span className={styles.unit}>bits</span>
          <span className={styles.lbl}>Entropy</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.val}>{charsetSize ?? 0}</span>
          <span className={styles.unit}>chars</span>
          <span className={styles.lbl}>Pool size</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat} style={{ maxWidth: 96 }}>
          <span className={styles.valSm}>{crackTime ?? '—'}</span>
          <span className={styles.lbl}>Crack time (10B/s)</span>
        </div>
      </div>

      {/* Explainer card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>// WHAT IS ENTROPY?</div>
        <div className={styles.cardBody}>
          <p>
            Password <strong>entropy</strong> measures unpredictability — how many guesses an
            attacker needs to crack your password.
          </p>

          {/* Formula */}
          <div className={styles.formula}>
            <span className={styles.fe}>E</span>
            <span className={styles.fop}> = </span>
            <span className={styles.fl}>L</span>
            <span className={styles.fop}> × log</span>
            <sub className={styles.fsub}>2</sub>
            <span className={styles.fpar}>(</span>
            <span className={styles.fr}>R</span>
            <span className={styles.fpar}>)</span>
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            {LEGEND.map(l => (
              <div key={l.var} className={styles.legRow}>
                <span className={`${styles.legVar} ${l.cls}`}>{l.var}</span>
                <span>{l.desc}</span>
              </div>
            ))}
          </div>

          {/* Scale */}
          <div>
            <div className={styles.scaleTitle}>Entropy reference scale</div>
            <div className={styles.scaleRows}>
              {SCALE.map(s => (
                <div key={s.bits} className={styles.scaleRow}>
                  <span className={styles.scaleBits}>{s.bits}</span>
                  <div className={styles.track}>
                    <div className={styles.fill} style={{ width: `${s.width}%`, background: s.color }} />
                  </div>
                  <span className={styles.scaleDesc}>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <p className={styles.note}>
            Every extra bit <strong>doubles</strong> the search space. A 100-bit password cannot
            be cracked even by the fastest GPU clusters within a human lifetime.
          </p>
        </div>
      </div>
    </div>
  );
}
