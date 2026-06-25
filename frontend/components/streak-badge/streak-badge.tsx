import styles from './streak-badge.module.css';

type Props = {
  streak: number;
  atRisk: boolean;
};

export default function StreakBadge({ streak, atRisk }: Props) {
  if (streak === 0 && !atRisk) return null;

  if (atRisk) {
    return (
      <p className={`${styles.badge} ${styles.atRisk}`}>
        Your {streak}-month streak is at risk — visit somewhere before the end of the month!
      </p>
    );
  }

  return (
    <p className={styles.badge}>
      {streak}-month streak
    </p>
  );
}
