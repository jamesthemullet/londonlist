import Link from 'next/link';
import { useEffect, useRef } from 'react';
import styles from './upgrade-modal.module.css';

const PRO_BENEFITS = [
  'Unlimited lists — no cap, ever',
  'Export any list as a CSV file',
  'View counts on all your public lists',
  'Early access to new features',
  'Priority support',
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UpgradeModal({ isOpen, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is a mouse-only convenience; keyboard users use Escape
    // biome-ignore lint/a11y/useKeyWithClickEvents: same rationale — Escape handler covers keyboard
    <div className={styles.overlay} onClick={onClose} aria-hidden="false">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-heading"
        className={styles.dialog}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close upgrade modal"
        >
          ✕
        </button>

        <span className={styles.badge}>Pro</span>
        <h2 id="upgrade-modal-heading" className={styles.heading}>
          You&rsquo;ve hit the free limit
        </h2>
        <p className={styles.subheading}>
          Free accounts can hold up to 3 lists. Upgrade to Pro for unlimited lists and more.
        </p>

        <ul className={styles.featureList}>
          {PRO_BENEFITS.map((benefit) => (
            <li key={benefit} className={styles.featureItem}>
              <span className={styles.checkIcon} aria-hidden="true">✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <Link href="/pricing" className={styles.upgradeCta} onClick={onClose}>
            See Pro plans
          </Link>
          <button type="button" className={styles.dismissButton} onClick={onClose}>
            Maybe later
          </button>
        </div>

        <p className={styles.trialNote}>14-day free trial · Cancel anytime</p>
      </div>
    </div>
  );
}
