import { useAppContext } from '../../context/AppContext';
import styles from './list-visibility-toggle.module.css';

type Props = {
  listDocumentId: string;
  isPublic: boolean;
  onToggle: () => void;
  listName: string;
};

export default function ListVisibilityToggle({ isPublic, onToggle, listDocumentId, listName }: Props) {
  const { user } = useAppContext();

  const shareUrl =
    user && typeof window !== 'undefined'
      ? `${window.location.origin}/list/${user.username}/${listDocumentId}`
      : '';

  return (
    <div className={styles.container}>
      <label className={styles.toggleLabel}>
        <span className={styles.labelText}>Make &ldquo;{listName}&rdquo; public</span>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={isPublic}
          onChange={onToggle}
        />
        <span className={styles.toggle} />
      </label>
      {isPublic && shareUrl && (
        <p className={styles.shareText}>
          Share your list:{' '}
          <a href={shareUrl} className={styles.shareLink} target="_blank" rel="noreferrer">
            {shareUrl}
          </a>
        </p>
      )}
    </div>
  );
}
