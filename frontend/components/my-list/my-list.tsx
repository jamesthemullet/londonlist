import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import Cookie from 'js-cookie';
import Loader from '../Loader';
import ProgressBar from '../progress-bar/progress-bar';
import styles from './my-list.module.css';

type ListItem = {
  documentId: string;
  name: string;
  category: string | null;
  completed: boolean;
  osm_id: string;
};

type ListItemsData = {
  listItems: ListItem[];
};

const GET_MY_LIST = gql`
  query GetMyList($userId: ID!) {
    listItems(filters: { user: { documentId: { eq: $userId } } }, sort: "createdAt:desc") {
      documentId
      name
      category
      completed
      osm_id
    }
  }
`;

const TOGGLE_COMPLETE = gql`
  mutation ToggleComplete($documentId: ID!, $completed: Boolean!) {
    updateListItem(documentId: $documentId, data: { completed: $completed }) {
      documentId
      completed
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

type MyListProps = {
  userId: string;
};

export default function MyList({ userId }: MyListProps) {
  const token = Cookie.get('token');
  const authHeader = { Authorization: `Bearer ${token}` };

  const { loading, error, data } = useQuery<ListItemsData>(GET_MY_LIST, {
    variables: { userId },
    context: { headers: authHeader },
  });

  const [toggleComplete] = useMutation(TOGGLE_COMPLETE, {
    context: { headers: authHeader },
  });

  const [deleteItem] = useMutation(DELETE_LIST_ITEM, {
    context: { headers: authHeader },
    refetchQueries: [{ query: GET_MY_LIST, variables: { userId }, context: { headers: authHeader } }],
  });

  if (loading) return <Loader />;
  if (error) return <p>Error loading your list.</p>;

  const items = data?.listItems ?? [];

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Your list is empty. Search for places above and add them!</p>
      </div>
    );
  }

  const todo = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  return (
    <div className={styles.container}>
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
                  toggleComplete({ variables: { documentId: item.documentId, completed: true } })
                }
                onDelete={() => deleteItem({ variables: { documentId: item.documentId } })}
              />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className={styles.sectionHeading}>Done ({done.length})</h2>
          <ul className={styles.list}>
            {done.map((item) => (
              <ListItemRow
                key={item.documentId}
                item={item}
                onToggle={() =>
                  toggleComplete({ variables: { documentId: item.documentId, completed: false } })
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
  return (
    <li className={styles.item}>
      <label className={styles.checkLabel}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={item.completed}
          onChange={onToggle}
        />
        <span className={item.completed ? styles.nameDone : styles.name}>
          {item.name}
        </span>
        {item.category && (
          <span className={styles.category}>{item.category}</span>
        )}
      </label>
      <button className={styles.deleteButton} onClick={onDelete} aria-label="Remove">
        ✕
      </button>
    </li>
  );
}
