import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import Cookie from 'js-cookie';
import Loader from '../Loader';
import styles from './my-list.module.css';

type ListItem = {
  id: string;
  attributes: {
    name: string;
    category: string | null;
    completed: boolean;
    osm_id: string;
  };
};

type ListItemsData = {
  listItems: {
    data: ListItem[];
  };
};

const GET_MY_LIST = gql`
  query GetMyList($userId: ID!) {
    listItems(filters: { user: { id: { eq: $userId } } }, sort: "createdAt:desc") {
      data {
        id
        attributes {
          name
          category
          completed
          osm_id
        }
      }
    }
  }
`;

const TOGGLE_COMPLETE = gql`
  mutation ToggleComplete($id: ID!, $completed: Boolean!) {
    updateListItem(id: $id, data: { completed: $completed }) {
      data {
        id
        attributes {
          completed
        }
      }
    }
  }
`;

const DELETE_LIST_ITEM = gql`
  mutation DeleteListItem($id: ID!) {
    deleteListItem(id: $id) {
      data {
        id
      }
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

  const items = data?.listItems?.data ?? [];

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Your list is empty. Search for places above and add them!</p>
      </div>
    );
  }

  const todo = items.filter((i) => !i.attributes.completed);
  const done = items.filter((i) => i.attributes.completed);

  return (
    <div className={styles.container}>
      {todo.length > 0 && (
        <section>
          <h2 className={styles.sectionHeading}>To do ({todo.length})</h2>
          <ul className={styles.list}>
            {todo.map((item) => (
              <ListItemRow
                key={item.id}
                item={item}
                onToggle={() =>
                  toggleComplete({ variables: { id: item.id, completed: true } })
                }
                onDelete={() => deleteItem({ variables: { id: item.id } })}
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
                key={item.id}
                item={item}
                onToggle={() =>
                  toggleComplete({ variables: { id: item.id, completed: false } })
                }
                onDelete={() => deleteItem({ variables: { id: item.id } })}
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
          checked={item.attributes.completed}
          onChange={onToggle}
        />
        <span className={item.attributes.completed ? styles.nameDone : styles.name}>
          {item.attributes.name}
        </span>
        {item.attributes.category && (
          <span className={styles.category}>{item.attributes.category}</span>
        )}
      </label>
      <button className={styles.deleteButton} onClick={onDelete} aria-label="Remove">
        ✕
      </button>
    </li>
  );
}
