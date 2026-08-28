import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import Loader from '../Loader';
import ProgressBar from '../progress-bar/progress-bar';
import StreakBadge from '../streak-badge/streak-badge';
import { useAuthHeader } from '../../hooks/use-auth-header';
import { useStreak } from '../../hooks/use-streak';
import styles from './my-list.module.css';
import type { MapItem } from '../map/list-map';

const ListMap = dynamic(() => import('../map/list-map'), { ssr: false });

type ListItem = {
  documentId: string;
  name: string;
  category: string | null;
  completed: boolean;
  osm_id: string;
  visitedAt: string | null;
  notes: string | null;
  lat?: number | null;
  lng?: number | null;
};

type ListItemsData = {
  listItems: ListItem[];
};

export const GET_MY_LIST = gql`
  query GetMyList($listDocumentId: ID) {
    listItems(
      sort: "createdAt:desc"
      filters: { list: { documentId: { eq: $listDocumentId } } }
    ) {
      documentId
      name
      category
      completed
      osm_id
      visitedAt
      notes
      lat
      lng
    }
  }
`;

const TOGGLE_COMPLETE = gql`
  mutation ToggleComplete($documentId: ID!, $completed: Boolean!, $visitedAt: DateTime) {
    updateListItem(documentId: $documentId, data: { completed: $completed, visitedAt: $visitedAt }) {
      documentId
      completed
      visitedAt
    }
  }
`;

const DELETE_LIST_ITEM = gql`
  mutation DeleteListItem($documentId: ID!) {
    deleteListItem(documentId: $documentId) {
      documentId
    }
  }
`;

const UPDATE_NOTES = gql`
  mutation UpdateItemNotes($documentId: ID!, $notes: String) {
    updateListItem(documentId: $documentId, data: { notes: $notes }) {
      documentId
      notes
    }
  }
`;

type Props = {
  listId: string;
  isPro?: boolean;
};

export default function MyList({ listId, isPro = false }: Props) {
  const authHeader = useAuthHeader();
  const [showMap, setShowMap] = useState(false);

  const { loading, error, data } = useQuery<ListItemsData>(GET_MY_LIST, {
    variables: { listDocumentId: listId },
    context: { headers: authHeader },
    fetchPolicy: 'cache-and-network',
  });

  const [toggleComplete] = useMutation(TOGGLE_COMPLETE, {
    context: { headers: authHeader },
    refetchQueries: [
      {
        query: GET_MY_LIST,
        variables: { listDocumentId: listId },
        context: { headers: authHeader },
      },
    ],
  });

  const [deleteItem] = useMutation(DELETE_LIST_ITEM, {
    context: { headers: authHeader },
    refetchQueries: [
      {
        query: GET_MY_LIST,
        variables: { listDocumentId: listId },
        context: { headers: authHeader },
      },
    ],
  });

  const [updateNotes] = useMutation(UPDATE_NOTES, {
    context: { headers: authHeader },
    refetchQueries: [
      {
        query: GET_MY_LIST,
        variables: { listDocumentId: listId },
        context: { headers: authHeader },
      },
    ],
  });

  const items = data?.listItems ?? [];
  const { streak, atRisk } = useStreak(items);

  if (loading && !data) return <Loader />;
  if (error) return <p>Error loading your list.</p>;

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Your list is empty. Search for places above and add them!</p>
      </div>
    );
  }

  const todo = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  const now = new Date();
  const visitedThisMonth = done.filter((i) => {
    if (!i.visitedAt) return false;
    const d = new Date(i.visitedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const mapItems: MapItem[] = items
    .filter((i): i is ListItem & { lat: number; lng: number } => i.lat != null && i.lng != null)
    .map((i) => ({
      documentId: i.documentId,
      name: i.name,
      lat: i.lat,
      lng: i.lng,
      completed: i.completed,
      category: i.category,
    }));

  return (
    <div className={styles.container}>
      <StreakBadge streak={streak} atRisk={atRisk} />
      <ProgressBar total={items.length} done={done.length} />
      <div className={styles.mapToggleRow}>
        {isPro ? (
          <button
            type="button"
            className={styles.mapToggle}
            onClick={() => setShowMap((s) => !s)}
            aria-expanded={showMap}
          >
            {showMap ? 'Hide map' : 'Show map'}
          </button>
        ) : (
          <p className={styles.mapUpgradeNudge}>
            <Link href="/pricing" className={styles.mapUpgradeLink}>
              Upgrade to Pro
            </Link>
            {' '}to view your places on a map.
          </p>
        )}
      </div>
      {isPro && showMap && mapItems.length > 0 && (
        <div className={styles.mapContainer}>
          <ListMap items={mapItems} />
        </div>
      )}
      {isPro && showMap && mapItems.length === 0 && (
        <p className={styles.mapNoCoords}>No places with location data yet — add more from the search above.</p>
      )}
      {todo.length > 0 && (
        <section>
          <h2 className={styles.sectionHeading}>To do ({todo.length})</h2>
          <ul className={styles.list}>
            {todo.map((item) => (
              <ListItemRow
                key={item.documentId}
                item={item}
                onToggle={() =>
                  toggleComplete({
                    variables: {
                      documentId: item.documentId,
                      completed: true,
                      visitedAt: new Date().toISOString(),
                    },
                  })
                }
                onDelete={() => deleteItem({ variables: { documentId: item.documentId } })}
                onSaveNotes={(notes) =>
                  updateNotes({ variables: { documentId: item.documentId, notes } })
                }
              />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section>
          {visitedThisMonth > 0 && (
            <p className={styles.monthlySummary}>
              {visitedThisMonth} {visitedThisMonth === 1 ? 'place' : 'places'} visited this month
            </p>
          )}
          <h2 className={styles.sectionHeading}>Done ({done.length})</h2>
          <ul className={styles.list}>
            {done.map((item) => (
              <ListItemRow
                key={item.documentId}
                item={item}
                onToggle={() =>
                  toggleComplete({
                    variables: {
                      documentId: item.documentId,
                      completed: false,
                      visitedAt: null,
                    },
                  })
                }
                onDelete={() => deleteItem({ variables: { documentId: item.documentId } })}
                onSaveNotes={(notes) =>
                  updateNotes({ variables: { documentId: item.documentId, notes } })
                }
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export type ListItemRowProps = {
  item: ListItem;
  onToggle: () => void;
  onDelete: () => void;
  onSaveNotes: (notes: string | null) => void;
};

export function ListItemRow({ item, onToggle, onDelete, onSaveNotes }: ListItemRowProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState(item.notes ?? '');

  const visitedLabel =
    item.completed && item.visitedAt
      ? `Visited ${new Date(item.visitedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : null;

  const handleSave = () => {
    const trimmed = draftNotes.trim();
    onSaveNotes(trimmed || null);
    setEditingNotes(false);
  };

  const handleCancel = () => {
    setDraftNotes(item.notes ?? '');
    setEditingNotes(false);
  };

  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={item.completed}
            onChange={onToggle}
          />
          <span className={item.completed ? styles.nameDone : styles.name}>{item.name}</span>
          {item.category && <span className={styles.category}>{item.category}</span>}
        </label>
        {visitedLabel && (
          <time className={styles.visitedAt} dateTime={item.visitedAt as string}>
            {visitedLabel}
          </time>
        )}
        <button
          type="button"
          className={styles.deleteButton}
          onClick={onDelete}
          aria-label={`Remove ${item.name}`}>
          ✕
        </button>
      </div>
      {editingNotes ? (
        <div className={styles.notesEdit}>
          <textarea
            className={styles.notesTextarea}
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            placeholder="Add a tip or note…"
            rows={2}
            maxLength={500}
            aria-label={`Notes for ${item.name}`}
          />
          <div className={styles.notesActions}>
            <button type="button" className={styles.notesSave} onClick={handleSave}>
              Save
            </button>
            <button type="button" className={styles.notesCancel} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.notesRow}>
          {item.notes ? (
            <button
              type="button"
              className={styles.notesText}
              onClick={() => {
                setDraftNotes(item.notes as string);
                setEditingNotes(true);
              }}
              aria-label={`Edit note for ${item.name}`}>
              {item.notes}
            </button>
          ) : (
            <button
              type="button"
              className={styles.notesAdd}
              onClick={() => {
                setDraftNotes('');
                setEditingNotes(true);
              }}>
              + Add note
            </button>
          )}
        </div>
      )}
    </li>
  );
}
