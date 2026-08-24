import Link from 'next/link';
import { useSavedLists } from '../../hooks/use-saved-lists';
import styles from './saved-lists-widget.module.css';

type Props = {
  limit?: number;
};

const DEFAULT_LIMIT = 4;

export default function SavedListsWidget({ limit = DEFAULT_LIMIT }: Props) {
  const { savedLists, unsave, hydrated } = useSavedLists();

  if (!hydrated || savedLists.length === 0) return null;

  const visible = savedLists.slice(0, limit);

  return (
    <section className={styles.section} aria-label="Your saved lists">
      <div className={styles.header}>
        <h2 className={styles.heading}>Saved lists</h2>
        <p className={styles.subheading}>
          {savedLists.length === 1
            ? 'One list bookmarked to explore later.'
            : `${savedLists.length} lists bookmarked to explore later.`}
        </p>
      </div>
      <ul className={styles.grid}>
        {visible.map((list) => (
          <li key={list.listId} className={styles.item}>
            <Link
              href={`/list/${list.username}/${list.listId}`}
              className={styles.card}
            >
              <span className={styles.name}>{list.name}</span>
              <span className={styles.author}>by {list.username}</span>
            </Link>
            <button
              type="button"
              className={styles.remove}
              onClick={() => unsave(list.listId)}
              aria-label={`Remove "${list.name}" from saved lists`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {savedLists.length > limit && (
        <p className={styles.more}>
          Showing {limit} of {savedLists.length}. Open a saved list to unbookmark it.
        </p>
      )}
    </section>
  );
}
