import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Loader from '../Loader';
import ProgressBar from '../progress-bar/progress-bar';
import StreakBadge from '../streak-badge/streak-badge';
import { useAuthHeader } from '../../hooks/use-auth-header';
import { useStreak } from '../../hooks/use-streak';
import styles from './my-list.module.css';

type ListItem = {
  documentId: string;
  name: string;
  category: string | null;
  completed: boolean;
  osm_id: string;
  visitedAt: string | null;
};

type ListItemsData = {
  listItems: ListItem[];
};

const GET_MY_LIST = gql`
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

type Props = {
  listId: string;
};

export default function MyList({ listId }: Props) {
  const authHeader = useAuthHeader();

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

  return (
    <div className={styles.container}>
      <StreakBadge streak={streak} atRisk={atRisk} />
      <ProgressBar total={items.length} done={done.length} />
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
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

type ListItemRowProps = {
  item: ListItem;
  onToggle: () => void;
  onDelete: () => void;
};

function ListItemRow({ item, onToggle, onDelete }: ListItemRowProps) {
  const visitedLabel =
    item.completed && item.visitedAt
      ? `Visited ${new Date(item.visitedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : null;

  return (
    <li className={styles.item}>
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
        <time className={styles.visitedAt} dateTime={item.visitedAt ?? ''}>
          {visitedLabel}
        </time>
      )}
      <button type="button" className={styles.deleteButton} onClick={onDelete} aria-label="Remove">
        ✕
      </button>
    </li>
  );
}
