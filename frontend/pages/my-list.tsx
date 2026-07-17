import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import ListVisibilityToggle from '../components/list-visibility-toggle/list-visibility-toggle';
import MyList from '../components/my-list/my-list';
import PlaceSearch from '../components/search/place-search';
import { useAppContext } from '../context/AppContext';
import { useAuthHeader } from '../hooks/use-auth-header';
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
  const authHeader = useAuthHeader();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const hasAutoCreated = useRef(false);

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const newListInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

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

  const [createList] = useMutation<{ createMyList: List }>(CREATE_MY_LIST, {
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
    if (!listsLoading && lists.length === 0 && initialized && user && !hasAutoCreated.current) {
      hasAutoCreated.current = true;
      createList({ variables: { name: 'My List' } }).then((result) => {
        const newList = result.data?.createMyList;
        if (newList) setActiveListId(newList.documentId);
      });
    }
  }, [listsLoading, lists.length, initialized, user, createList]);

  useEffect(() => {
    if (lists.length > 0 && !activeListId) {
      setActiveListId(lists[0].documentId);
    }
    if (activeListId && lists.length > 0 && !lists.find((l) => l.documentId === activeListId)) {
      setActiveListId(lists[0].documentId);
    }
  }, [lists, activeListId]);

  useEffect(() => {
    if (isCreatingNew) newListInputRef.current?.focus();
  }, [isCreatingNew]);

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.focus();
  }, [isRenaming]);

  const activeList = lists.find((l) => l.documentId === activeListId) ?? null;

  const handleOpenNewList = () => {
    setNewListName('');
    setIsCreatingNew(true);
    setIsRenaming(false);
    setIsConfirmingDelete(false);
  };

  const handleCreateNewList = async () => {
    const name = newListName.trim();
    if (!name) return;
    setIsCreatingNew(false);
    setNewListName('');
    const result = await createList({ variables: { name } });
    const newList = result.data?.createMyList;
    if (newList) setActiveListId(newList.documentId);
  };

  const handleCancelNewList = () => {
    setIsCreatingNew(false);
    setNewListName('');
  };

  const handleOpenRename = () => {
    if (!activeList) return;
    setRenameValue(activeList.name);
    setIsRenaming(true);
    setIsCreatingNew(false);
    setIsConfirmingDelete(false);
  };

  const handleSaveRename = async () => {
    const name = renameValue.trim();
    if (!name || name === activeList?.name) {
      setIsRenaming(false);
      return;
    }
    setIsRenaming(false);
    await updateList({ variables: { documentId: activeList?.documentId, name } });
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setRenameValue('');
  };

  const handleOpenDeleteConfirm = () => {
    setIsConfirmingDelete(true);
    setIsRenaming(false);
    setIsCreatingNew(false);
  };

  const handleConfirmDelete = async () => {
    if (!activeList) return;
    setIsConfirmingDelete(false);
    await deleteList({ variables: { documentId: activeList.documentId } });
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
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

        {lists.length >= 3 && !user?.isPro && (
          <aside className={styles.upgradeBanner}>
            <p className={styles.upgradeBannerText}>
              You have {lists.length} lists. Unlock unlimited lists with{' '}
              <strong>London List Pro</strong>.{' '}
              <Link href="/pricing" className={styles.upgradeBannerLink}>
                See pricing
              </Link>
            </p>
          </aside>
        )}

        <div className={styles.tabs} role="tablist" aria-label="Your lists">
          {lists.map((list) => (
            <button
              key={list.documentId}
              type="button"
              role="tab"
              aria-selected={list.documentId === activeListId}
              className={list.documentId === activeListId ? styles.tabActive : styles.tab}
              onClick={() => {
                setActiveListId(list.documentId);
                setIsRenaming(false);
                setIsConfirmingDelete(false);
              }}>
              {list.name}
            </button>
          ))}
          {isCreatingNew ? (
            <form
              className={styles.newListForm}
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateNewList();
              }}
              aria-label="Create new list">
              <label htmlFor="new-list-name" className={styles.srOnly}>
                New list name
              </label>
              <input
                id="new-list-name"
                ref={newListInputRef}
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className={styles.newListInput}
                placeholder="List name"
                maxLength={80}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancelNewList();
                }}
              />
              <button
                type="submit"
                className={styles.newListCreate}
                disabled={!newListName.trim()}>
                Create
              </button>
              <button
                type="button"
                className={styles.newListCancel}
                onClick={handleCancelNewList}>
                Cancel
              </button>
            </form>
          ) : (
            <button type="button" className={styles.tabNew} onClick={handleOpenNewList}>
              + New list
            </button>
          )}
        </div>

        {activeList && (
          <>
            {isRenaming ? (
              <form
                className={styles.renameForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveRename();
                }}
                aria-label={`Rename list "${activeList.name}"`}>
                <label htmlFor="rename-list" className={styles.srOnly}>
                  New name for &quot;{activeList.name}&quot;
                </label>
                <input
                  id="rename-list"
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className={styles.renameInput}
                  maxLength={80}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancelRename();
                  }}
                />
                <button
                  type="submit"
                  className={styles.renameSave}
                  disabled={!renameValue.trim()}>
                  Save
                </button>
                <button
                  type="button"
                  className={styles.renameCancel}
                  onClick={handleCancelRename}>
                  Cancel
                </button>
              </form>
            ) : null}

            <section className={styles.section}>
              <h2 className={styles.subheading}>Add a place</h2>
              <PlaceSearch listId={activeList.documentId} />
            </section>
            <section className={styles.section}>
              <MyList listId={activeList.documentId} />
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

            {isConfirmingDelete ? (
              <div className={styles.deleteConfirm} role="alertdialog" aria-labelledby="delete-confirm-heading">
                <p id="delete-confirm-heading" className={styles.deleteConfirmText}>
                  Delete &quot;{activeList.name}&quot;? This cannot be undone.
                </p>
                <div className={styles.deleteConfirmButtons}>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    onClick={handleConfirmDelete}>
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={handleCancelDelete}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.listActions}>
                <button type="button" className={styles.actionButton} onClick={handleOpenRename}>
                  Rename list
                </button>
                {lists.length > 1 && (
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    onClick={handleOpenDeleteConfirm}>
                    Delete list
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
