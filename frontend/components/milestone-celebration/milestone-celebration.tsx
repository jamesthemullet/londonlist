import styles from './milestone-celebration.module.css';

type Props = {
  milestone: 25 | 50 | 75 | 100;
  listName: string;
  shareUrl?: string;
  onDismiss: () => void;
};

const MILESTONE_COPY: Record<number, { emoji: string; headline: string; sub: string }> = {
  25: {
    emoji: '🏁',
    headline: "You're a quarter of the way there!",
    sub: "Keep exploring — 75% of your list is still waiting.",
  },
  50: {
    emoji: '⭐',
    headline: "Halfway through!",
    sub: "You're on a roll — halfway through your London adventure.",
  },
  75: {
    emoji: '🔥',
    headline: "Three-quarters done!",
    sub: "Almost there — just a few more places left to tick off.",
  },
  100: {
    emoji: '🎉',
    headline: "You completed the list!",
    sub: "You've explored every place on your list. Amazing work!",
  },
};

export function buildShareText(milestone: number, listName: string, shareUrl: string): string {
  const verb = milestone === 100 ? `completed` : `${milestone}% through`;
  return `I've ${verb} my "${listName}" London list! ${shareUrl}`;
}

export default function MilestoneCelebration({ milestone, listName, shareUrl, onDismiss }: Props) {
  const copy = MILESTONE_COPY[milestone];

  const twitterUrl = shareUrl
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareText(milestone, listName, shareUrl))}`
    : null;

  const whatsappUrl = shareUrl
    ? `https://wa.me/?text=${encodeURIComponent(buildShareText(milestone, listName, shareUrl))}`
    : null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Milestone: ${milestone}% complete`}
      className={styles.banner}
    >
      <button
        type="button"
        className={styles.dismiss}
        onClick={onDismiss}
        aria-label="Dismiss milestone celebration"
      >
        ✕
      </button>
      <span className={styles.emoji} aria-hidden="true">
        {copy.emoji}
      </span>
      <p className={styles.headline}>{copy.headline}</p>
      <p className={styles.sub}>{copy.sub}</p>
      {(twitterUrl || whatsappUrl) && (
        <div className={styles.shareRow}>
          <span className={styles.shareLabel}>Share your progress:</span>
          {twitterUrl && (
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shareLink}
              aria-label="Share progress on X (Twitter)"
            >
              X / Twitter
            </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shareLink}
              aria-label="Share progress on WhatsApp"
            >
              WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
