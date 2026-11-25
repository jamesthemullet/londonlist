import { useId } from 'react';
import styles from './list-visibility-toggle.module.css';

type Props = {
  isPublic: boolean;
  onToggle: () => void;
  listName: string;
};

/** Private / Public segmented control built on native radio inputs (arrow keys work for free). */
export default function ListVisibilityToggle({ isPublic, onToggle, listName }: Props) {
  const name = useId();

  return (
    <fieldset className={styles.group}>
      <legend className={styles.srOnly}>Visibility of &ldquo;{listName}&rdquo;</legend>
      <label className={styles.option}>
        <input
          type="radio"
          name={name}
          className={styles.input}
          checked={!isPublic}
          onChange={() => isPublic && onToggle()}
        />
        <span className={styles.text}>Private</span>
      </label>
      <label className={styles.option}>
        <input
          type="radio"
          name={name}
          className={styles.input}
          checked={isPublic}
          onChange={() => !isPublic && onToggle()}
        />
        <span className={styles.text}>Public</span>
      </label>
    </fieldset>
  );
}
