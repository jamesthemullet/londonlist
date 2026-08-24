import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useSavedLists } from '../../hooks/use-saved-lists';
import UpgradeModal from '../upgrade-modal/upgrade-modal';
import styles from './save-list-button.module.css';

type Props = {
  listId: string;
  username: string;
  name: string;
};

const CONFIRM_TIMEOUT_MS = 2200;

export default function SaveListButton({ listId, username, name }: Props) {
  const { user } = useAppContext();
  const { isSaved, save, unsave, hydrated } = useSavedLists();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!hydrated) return null;

  const saved = isSaved(listId);

  const handleClick = () => {
    if (saved) {
      unsave(listId);
      setJustSaved(false);
      return;
    }
    const outcome = save(
      { listId, username, name },
      { isPro: user?.isPro ?? false },
    );
    if (outcome === 'limit_reached') {
      setShowUpgrade(true);
      return;
    }
    setJustSaved(true);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustSaved(false), CONFIRM_TIMEOUT_MS);
  };

  const label = saved
    ? justSaved
      ? 'Saved!'
      : 'Saved · Remove'
    : 'Save for later';

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={saved ? styles.buttonSaved : styles.button}
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={
          saved
            ? `Remove "${name}" from your saved lists`
            : `Save "${name}" to view later`
        }
      >
        <span className={styles.icon} aria-hidden="true">
          {saved ? '★' : '☆'}
        </span>
        {label}
      </button>
      {justSaved && (
        <p className={styles.confirmation} role="status">
          Added to your saved lists.
        </p>
      )}
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
