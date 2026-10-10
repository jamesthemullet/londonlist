import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuthHeader } from '../../hooks/use-auth-header';
import styles from './add-to-list-button.module.css';

type Props = {
  osm_id: string;
  name: string;
  category: string | null;
  lat: number | null;
  lng: number | null;
};

type ListSlim = {
  documentId: string;
  name: string;
};

type MyListsData = {
  myLists: ListSlim[];
};

const GET_MY_LISTS_SLIM = gql`
  query GetMyListsSlim {
    myLists {
      documentId
      name
    }
  }
`;

const CREATE_LIST_ITEM = gql`
  mutation CreateListItemFromDetail(
    $osm_id: String!
    $name: String!
    $lat: Float
    $lng: Float
    $category: String
    $list: ID
  ) {
    createListItem(
      data: {
        osm_id: $osm_id
        name: $name
        lat: $lat
        lng: $lng
        category: $category
        completed: false
        list: $list
      }
    ) {
      documentId
      name
    }
  }
`;

export default function AddToListButton({ osm_id, name, category, lat, lng }: Props) {
  const { user, initialized } = useAppContext();
  const authHeader = useAuthHeader();
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery<MyListsData>(GET_MY_LISTS_SLIM, {
    context: { headers: authHeader },
    skip: !initialized || !user,
  });

  const [createListItem] = useMutation(CREATE_LIST_ITEM);

  if (!initialized) return null;

  if (!user) {
    return (
      <aside className={styles.ctaBanner} aria-label="Save this place">
        <p className={styles.ctaText}>
          <Link href="/register" className={styles.ctaLink}>
            Create a free account
          </Link>{' '}
          to save this place to your London list.
        </p>
      </aside>
    );
  }

  const lists = data?.myLists ?? [];
  const targetList = lists[0];

  async function handleAdd() {
    setError(null);
    setAdding(true);
    try {
      const result = await createListItem({
        variables: {
          osm_id,
          name,
          lat,
          lng,
          category,
          list: targetList?.documentId,
        },
        context: { headers: authHeader },
        refetchQueries: ['GetMyList'],
      });
      if (!result.data?.createListItem) {
        setError('Could not add to list. Please try again.');
        return;
      }
      setAdded(true);
    } catch (err) {
      const graphqlErr = err as { graphQLErrors?: Array<{ extensions?: { code?: string } }> };
      const code = graphqlErr.graphQLErrors?.[0]?.extensions?.code;
      if (code === 'FREE_ITEM_LIMIT_REACHED') {
        setError(
          "You've reached the free item limit. Upgrade to Pro for unlimited items.",
        );
      } else {
        setError('Could not add to list. Please try again.');
      }
    } finally {
      setAdding(false);
    }
  }

  if (added) {
    return (
      <div className={styles.addedBanner} role="status">
        <span className={styles.addedCheck} aria-hidden="true">✓</span>
        <span>Added to your list</span>
        <Link href="/my-list" className={styles.addedLink}>
          View my list →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.addButton}
        onClick={handleAdd}
        disabled={adding}
        aria-label={`Add ${name} to my list`}
      >
        {adding ? 'Adding…' : '+ Add to my list'}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
