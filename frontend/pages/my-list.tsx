import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Cookie from 'js-cookie';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ListVisibilityToggle from '../components/list-visibility-toggle/list-visibility-toggle';
import MyList from '../components/my-list/my-list';
import PlaceSearch from '../components/search/place-search';
import { useAppContext } from '../context/AppContext';
import styles from './my-list.module.css';

type List = {
  documentId: string;
  name: string;
  isPublic: boolean;
};

type MyListsData = {
  myLists: List[];
};

const GET_MY_LISTS = gql`
  query GetMyLists {
    myLists {
      documentId
      name
      isPublic
    }
  }
`;

const CREATE_MY_LIST = gql`
  mutation CreateMyList($name: String!) {
    createMyList(name: $name) {
      documentId
      name
      isPublic
    }
  }
`;

const UPDATE_MY_LIST = gql`
  mutation UpdateMyList($documentId: ID!, $name: String, $isPublic: Boolean) {
    updateMyList(documentId: $documentId, name: $name, isPublic: $isPublic) {
      documentId
      name
      isPublic
    }
  }
`;

const DELETE_MY_LIST = gql`
  mutation DeleteMyList($documentId: ID!) {
    deleteMyList(documentId: $documentId)
  }
`;

export default function MyListPage() {
  const { user, initialized } = useAppContext();
  const router = useRouter();
  const token = Cookie.get('token');
  const authHeader = { Authorization: `Bearer ${token}` };
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);

  useEffect(() => {
    if (initialized && user === null) {
      router.push('/login');
    }
  }, [initialized, user, router]);

  const { data, loading: listsLoading } = useQuery<MyListsData>(GET_MY_LISTS, {
    context: { headers: authHeader },
    skip: !initialized || !user,
    fetchPolicy: 'network-only',
  });

  const [createList] = useMutation(CREATE_MY_LIST, {
    context: { headers: authHeader },
    refetchQueries: [{ query: GET_MY_LISTS, context: { headers: authHeader } }],
    awaitRefetchQueries: true,
  });

  const [updateList] = useMutation(UPDATE_MY_LIST, {
    context: { headers: authHeader },
    refetchQueries: [{ query: GET_MY_LISTS, context: { headers: authHeader } }],
  });

  const [deleteList] = useMutation(DELETE_MY_LIST, {
    context: { headers: authHeader },
    refetchQueries: [{ query: GET_MY_LISTS, context: { headers: authHeader } }],
  });

  const lists = data?.myLists ?? [];

  useEffect(() => {
    if (!listsLoading && lists.length === 0 && initialized && user && !autoCreating) {
      setAutoCreating(true);
      createList({ variables: { name: 'My List' } }).then((result) => {
        const newList = (result.data as { createMyList?: List } | null)?.createMyList;
        if (newList) setActiveListId(newList.documentId);
      });
    }
  }, [listsLoading, lists.length, initialized, user, autoCreating, createList]);

  useEffect(() => {
    if (lists.length > 0 && !activeListId) {
      setActiveListId(lists[0].documentId);
    }
    if (activeListId && lists.length > 0 && !lists.find((l) => l.documentId === activeListId)) {
      setActiveListId(lists[0].documentId);
    }
  }, [lists, activeListId]);

  const activeList = lists.find((l) => l.documentId === activeListId) ?? null;

  const handleNewList = async () => {
    const name = window.prompt('List name:');
    if (!name?.trim()) return;
    const result = await createList({ variables: { name: name.trim() } });
    const newList = (result.data as { createMyList?: List } | null)?.createMyList;
    if (newList) setActiveListId(newList.documentId);
  };

  const handleRenameList = async () => {
    if (!activeList) return;
    const name = window.prompt('New name:', activeList.name);
    if (!name?.trim() || name.trim() === activeList.name) return;
    await updateList({ variables: { documentId: activeList.documentId, name: name.trim() } });
  };

  const handleDeleteList = async () => {
    if (!activeList) return;
    if (!window.confirm(`Delete "${activeList.name}" and all its places?`)) return;
    await deleteList({ variables: { documentId: activeList.documentId } });
  };

  const handleToggleVisibility = async () => {
    if (!activeList) return;
    await updateList({
      variables: { documentId: activeList.documentId, isPublic: !activeList.isPublic },
    });
  };

  if (!initialized || !user) return null;

  return (
    <>
      <Head>
        <title>My Lists — London List</title>
        <meta name="description" content="Your London to-do lists" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.heading}>My Lists</h1>

        <div className={styles.tabs}>
          {lists.map((list) => (
            <button
              key={list.documentId}
              type="button"
              className={list.documentId === activeListId ? styles.tabActive : styles.tab}
              onClick={() => setActiveListId(list.documentId)}
            >
              {list.name}
            </button>
          ))}
          <button type="button" className={styles.tabNew} onClick={handleNewList}>
            + New list
          </button>
        </div>

        {activeList && activeListId && (
          <>
            <section className={styles.section}>
              <h2 className={styles.subheading}>Add a place</h2>
              <PlaceSearch listId={activeListId} />
            </section>
            <section className={styles.section}>
              <MyList listId={activeListId} />
            </section>
            <section className={styles.section}>
              <h2 className={styles.subheading}>List settings</h2>
              <ListVisibilityToggle
                listDocumentId={activeList.documentId}
                isPublic={activeList.isPublic}
                onToggle={handleToggleVisibility}
                listName={activeList.name}
              />
            </section>
            <div className={styles.listActions}>
              <button type="button" className={styles.actionButton} onClick={handleRenameList}>
                Rename list
              </button>
              {lists.length > 1 && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                  onClick={handleDeleteList}
                >
                  Delete list
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
