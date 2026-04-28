import styles from './progress-bar.module.css';

type ProgressBarProps = {
  total: number;
  done: number;
};

function milestoneMessage(pct: number): string {
  if (pct === 100) return "London conquered! Every place ticked off.";
  if (pct >= 75) return "Almost there — the finish line is in sight!";
  if (pct >= 50) return "Halfway through your London adventure!";
  if (pct >= 25) return "Great start — a quarter of the way there!";
  return "Your London exploration begins…";
}

export default function ProgressBar({ total, done }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className={styles.wrapper}>
      <div className={styles.meta}>
        <span className={styles.message}>{milestoneMessage(pct)}</span>
        <span className={styles.count}>{done} / {total}</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
