import Link from 'next/link';
import styles from './welcome-checklist.module.css';

type WelcomeChecklistProps = {
  hasAddedPlace: boolean;
  hasPublicList: boolean;
  hasMultipleLists: boolean;
  isPro: boolean;
  onDismiss: () => void;
};

type Step = {
  id: string;
  label: string;
  detail: string;
  completed: boolean;
  href?: string;
  ctaLabel?: string;
};

export function buildSteps(
  hasAddedPlace: boolean,
  hasPublicList: boolean,
  hasMultipleLists: boolean,
  isPro: boolean,
): Step[] {
  const steps: Step[] = [
    {
      id: 'add-place',
      label: 'Add your first place',
      detail: 'Search above and add a London spot to your list.',
      completed: hasAddedPlace,
    },
    {
      id: 'go-public',
      label: 'Share your list',
      detail: 'Make your list public so others can discover it.',
      completed: hasPublicList,
    },
    {
      id: 'second-list',
      label: 'Create a second list',
      detail: 'Organise your London adventures into separate lists.',
      completed: hasMultipleLists,
    },
  ];

  if (!isPro) {
    steps.push({
      id: 'upgrade-pro',
      label: 'Unlock unlimited lists',
      detail: 'Go Pro for unlimited lists, analytics, and early access to new features.',
      completed: false,
      href: '/pricing',
      ctaLabel: 'Upgrade to Pro',
    });
  }

  return steps;
}

export default function WelcomeChecklist({
  hasAddedPlace,
  hasPublicList,
  hasMultipleLists,
  isPro,
  onDismiss,
}: WelcomeChecklistProps) {
  const steps = buildSteps(hasAddedPlace, hasPublicList, hasMultipleLists, isPro);

  const allDone = steps.every((s) => s.completed);
  if (allDone) return null;

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <aside className={styles.checklist} aria-label="Getting started checklist">
      <div className={styles.header}>
        <h2 className={styles.heading}>Get started</h2>
        <button
          type="button"
          className={styles.dismissButton}
          onClick={onDismiss}
          aria-label="Dismiss getting started checklist"
        >
          ✕
        </button>
      </div>
      <p className={styles.progress}>
        {completedCount} of {steps.length} done
      </p>
      <ol className={styles.stepList}>
        {steps.map((step) => (
          <li key={step.id} className={step.completed ? styles.stepDone : styles.step}>
            <span
              className={step.completed ? styles.checkDone : styles.checkEmpty}
              aria-hidden="true"
            >
              {step.completed ? '✓' : '○'}
            </span>
            <div className={styles.stepContent}>
              <span className={step.completed ? styles.labelDone : styles.label}>
                {step.label}
              </span>
              {!step.completed && (
                <span className={styles.detail}>{step.detail}</span>
              )}
              {!step.completed && step.href && step.ctaLabel && (
                <Link href={step.href} className={styles.cta}>
                  {step.ctaLabel} →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
