import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import dynamic from 'next/dynamic';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import Loader from '../Loader';
import MilestoneCelebration from '../milestone-celebration/milestone-celebration';
import ProgressBar from '../progress-bar/progress-bar';
import StreakBadge from '../streak-badge/streak-badge';
import BookingLinks from '../booking-links/booking-links';
import OpenInMapsButton from '../open-in-maps-button/open-in-maps-button';
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

const MILESTONES = [25, 50, 75, 100] as const;
type Milestone = (typeof MILESTONES)[number];

export function getMilestoneCrossed(
  prevDone: number,
  newDone: number,
  total: number,
): Milestone | null {
  for (const milestone of MILESTONES) {
    const threshold = Math.ceil((milestone / 100) * total);
    if (newDone >= threshold && prevDone < threshold) {
      return milestone;
    }
  }
  return null;
}

function placesLabel(count: number) {
  return `${count} ${count === 1 ? 'place' : 'places'}`;
}

type Props = {
  listId: string;
  listName: string;
  shareUrl?: string;
  /** List title, description and actions, shown at the top of the main column */
  header?: ReactNode;
  /** Place search, shown between the progress bar and the item sections */
  search?: ReactNode;
  /** Shown at the top of the sidebar, above the map */
  sidebarTop?: ReactNode;
  /** Shown at the bottom of the sidebar, below the map */
  sidebarBottom?: ReactNode;
};

export default function MyList({
  listId,
  listName,
  shareUrl,
  header,
  search,
  sidebarTop,
  sidebarBottom,
}: Props) {
  const authHeader = useAuthHeader();
  const [showMap, setShowMap] = useState(true);
  const [celebrationMilestone, setCelebrationMilestone] = useState<Milestone | null>(null);
  const prevDoneCountRef = useRef<number | null>(null);

  const { loading, error, data } = useQuery<ListItemsData>(GET_MY_LIST, {
    variables: { listDocumentId: listId },
    context: { headers: authHeader },
    fetchPolicy: 'cache-and-network',
  });

  const refetchList = [
    {
      query: GET_MY_LIST,
      variables: { listDocumentId: listId },
      context: { headers: authHeader },
    },
  ];

  const [toggleComplete] = useMutation(TOGGLE_COMPLETE, {
    context: { headers: authHeader },
    refetchQueries: refetchList,
  });

  const [deleteItem] = useMutation(DELETE_LIST_ITEM, {
    context: { headers: authHeader },
    refetchQueries: refetchList,
  });

  const [updateNotes] = useMutation(UPDATE_NOTES, {
    context: { headers: authHeader },
    refetchQueries: refetchList,
  });

  const items = data?.listItems ?? [];
  const { streak, atRisk } = useStreak(items);
  const done = items.filter((i) => i.completed);

  useEffect(() => {
    const total = items.length;
    const newDoneCount = done.length;

    if (total === 0) return;

    if (prevDoneCountRef.current === null) {
      prevDoneCountRef.current = newDoneCount;
      return;
    }

    const prevCount = prevDoneCountRef.current;
    prevDoneCountRef.current = newDoneCount;

    if (newDoneCount <= prevCount) return;

    const crossed = getMilestoneCrossed(prevCount, newDoneCount, total);
    if (crossed !== null) {
      setCelebrationMilestone(crossed);
    }
  }, [done.length, items.length]);

  const isInitialLoad = loading && !data;
  const hasItems = !isInitialLoad && !error && items.length > 0;
  const todo = items.filter((i) => !i.completed);

  // Number places by position in the whole list, so a place keeps its number when it moves to Done
  const numberOf = new Map(
    items.map((item, i) => [item.documentId, String(i + 1).padStart(2, '0')]),
  );

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

  const todoWithCoords = todo.filter(
    (i): i is typeof i & { lat: number; lng: number } => i.lat != null && i.lng != null,
  );

  const renderRow = (item: ListItem) => (
    <ListItemRow
      key={item.documentId}
      item={item}
      number={numberOf.get(item.documentId)}
      onToggle={() =>
        toggleComplete({
          variables: item.completed
            ? { documentId: item.documentId, completed: false, visitedAt: null }
            : {
                documentId: item.documentId,
                completed: true,
                visitedAt: new Date().toISOString(),
              },
        })
      }
      onDelete={() => deleteItem({ variables: { documentId: item.documentId } })}
      onSaveNotes={(notes) => updateNotes({ variables: { documentId: item.documentId, notes } })}
    />
  );

  let content: ReactNode;
  if (isInitialLoad) {
    content = <Loader />;
  } else if (error) {
    content = <p className={styles.empty}>Error loading your list.</p>;
  } else if (items.length === 0) {
    content = (
      <p className={styles.empty}>Your list is empty. Search for places above and add them!</p>
    );
  } else {
    content = (
      <>
        <section className={styles.itemSection} aria-labelledby={`todo-heading-${listId}`}>
          <div className={styles.sectionHeader}>
            <h3 id={`todo-heading-${listId}`} className={styles.sectionHeading}>
              To do
            </h3>
            <span className={styles.sectionCount}>{placesLabel(todo.length)}</span>
          </div>
          {todo.length > 0 ? (
            <ul className={styles.list}>{todo.map(renderRow)}</ul>
          ) : (
            <p className={styles.sectionEmpty}>
              Nothing left to do. Search above to add more places.
            </p>
          )}
        </section>

        {done.length > 0 && (
          <section className={styles.itemSection} aria-labelledby={`done-heading-${listId}`}>
            <div className={styles.sectionHeader}>
              <h3 id={`done-heading-${listId}`} className={styles.sectionHeading}>
                Done
              </h3>
              <span className={styles.sectionCount}>{placesLabel(done.length)}</span>
            </div>
            <ul className={styles.list}>{done.map(renderRow)}</ul>
          </section>
        )}
      </>
    );
  }

  return (
    <div className={styles.body}>
      {celebrationMilestone !== null && (
        <MilestoneCelebration
          milestone={celebrationMilestone}
          listName={listName}
          shareUrl={shareUrl}
          onDismiss={() => setCelebrationMilestone(null)}
        />
      )}

      <div className={styles.primary}>
        {header}
        {hasItems && (
          <div className={styles.progress}>
            <ProgressBar
              total={items.length}
              done={done.length}
              note={
                visitedThisMonth > 0
                  ? `${placesLabel(visitedThisMonth)} visited this month`
                  : null
              }
            />
            <StreakBadge streak={streak} atRisk={atRisk} />
          </div>
        )}
        {search}
        {content}
      </div>

      <div className={styles.sidebar}>
        {sidebarTop}
        {hasItems && (
          <section className={styles.mapPanel} aria-labelledby={`map-heading-${listId}`}>
            <div className={styles.panelHeader}>
              <h3 id={`map-heading-${listId}`} className={styles.panelHeading}>
                Map
              </h3>
              <button
                type="button"
                className={styles.mapToggle}
                onClick={() => setShowMap((s) => !s)}
                aria-expanded={showMap}
                aria-controls={`list-map-region-${listId}`}
              >
                {showMap ? 'Hide map' : 'Show map'}
              </button>
            </div>
            <div id={`list-map-region-${listId}`}>
              {showMap && mapItems.length > 0 && <ListMap items={mapItems} />}
              {showMap && mapItems.length === 0 && (
                <p className={styles.mapNoCoords}>
                  No places with location data yet — add more from the search above.
                </p>
              )}
            </div>
            {todoWithCoords.length > 0 && (
              <OpenInMapsButton places={todoWithCoords} className={styles.openInMaps} />
            )}
          </section>
        )}
        {sidebarBottom}
      </div>
    </div>
  );
}

export type ListItemRowProps = {
  item: ListItem;
  /** Zero-padded position in the list, e.g. "03" */
  number?: string;
  onToggle: () => void;
  onDelete: () => void;
  onSaveNotes: (notes: string | null) => void;
};

export function ListItemRow({ item, number, onToggle, onDelete, onSaveNotes }: ListItemRowProps) {
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
    <li className={item.completed ? styles.itemDone : styles.item}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={item.completed}
        onChange={onToggle}
        aria-label={item.completed ? `Mark ${item.name} as not visited` : `Mark ${item.name} as visited`}
      />
      <span className={styles.number} aria-hidden="true">
        {number}
      </span>
      <div className={styles.itemBody}>
        <span className={styles.name}>{item.name}</span>
        {(item.category || visitedLabel) && (
          <span className={styles.meta}>
            {item.category && <span className={styles.category}>{item.category}</span>}
            {visitedLabel && (
              <time className={styles.visitedAt} dateTime={item.visitedAt as string}>
                {visitedLabel}
              </time>
            )}
          </span>
        )}
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
        ) : item.notes ? (
          <button
            type="button"
            className={styles.notesText}
            onClick={() => {
              setDraftNotes(item.notes as string);
              setEditingNotes(true);
            }}
            aria-label={`Edit note for ${item.name}`}
          >
            {item.notes}
          </button>
        ) : (
          <button
            type="button"
            className={styles.notesAdd}
            aria-label={`Add note for ${item.name}`}
            onClick={() => {
              setDraftNotes('');
              setEditingNotes(true);
            }}
          >
            + Add note
          </button>
        )}
        {!item.completed && (
          <div className={styles.bookings}>
            <BookingLinks name={item.name} category={item.category} />
          </div>
        )}
      </div>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={onDelete}
        aria-label={`Remove ${item.name}`}
      >
        ✕
      </button>
    </li>
  );
}
