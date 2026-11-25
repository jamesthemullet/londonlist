import styles from './progress-bar.module.css';

type ProgressBarProps = {
  total: number;
  done: number;
  /** Optional secondary line shown opposite the count, e.g. "2 places visited this month" */
  note?: string | null;
};

/** Above this many places, one block per place gets too thin to read, so show a solid fill instead. */
const MAX_SEGMENTS = 30;

export default function ProgressBar({ total, done, note }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const segmented = total > 0 && total <= MAX_SEGMENTS;

  return (
    <div className={styles.wrapper}>
      <div className={styles.meta}>
        <span className={styles.count}>
          {done} of {total} visited — {pct}%
        </span>
        {note && <span className={styles.note}>{note}</span>}
      </div>
      <div
        className={segmented ? styles.segments : styles.track}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="List progress"
      >
        {segmented ? (
          Array.from({ length: total }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional and never reorder
              key={i}
              className={i < done ? styles.segmentDone : styles.segment}
              data-testid="progress-segment"
              data-done={i < done}
            />
          ))
        ) : (
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        )}
      </div>
    </div>
  );
}
