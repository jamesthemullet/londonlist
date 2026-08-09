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
  description?: string | null;
  isPublic: boolean;
  viewCount: number;
};

type MyListsData = {
  myLists: List[];
};

const GET_MY_LISTS = gql`
  query GetMyLists {
    myLists {
      documentId
      name
      description
      isPublic
      viewCount
    }
  }
`;

const CREATE_MY_LIST = gql`
  mutation CreateMyList($name: String!) {
    createMyList(name: $name) {
      documentId
      name
      description
      isPublic
      viewCount
    }
  }
`;

const UPDATE_MY_LIST = gql`
  mutation UpdateMyList($documentId: ID!, $name: String, $isPublic: Boolean, $description: String) {
    updateMyList(documentId: $documentId, name: $name, isPublic: $isPublic, description: $description) {
      documentId
      name
      description
      isPublic
      viewCount
    }
  }
`;

const DELETE_MY_LIST = gql`
  mutation DeleteMyList($documentId: ID!) {
    deleteMyList(documentId: $documentId)
  }
`;

const FREE_LIST_LIMIT = 3;

function ProStatsCard({ lists, isPro }: { lists: List[]; isPro: boolean }) {
  const publicLists = lists.filter((l) => l.isPublic);
  if (publicLists.length === 0) return null;

  if (!isPro) {
    return (
      <aside className={styles.statsCard} aria-label="List analytics">
        <p className={styles.statsLockedText}>
          <Link href="/pricing" className={styles.statsUpgradeLink}>
            Upgrade to Pro to unlock list analytics
          </Link>
          {' '}and see how many times your lists have been viewed.
        </p>
      </aside>
    );
  }

  const totalViews = publicLists.reduce((sum, l) => sum + (l.viewCount ?? 0), 0);
  const topList =
    publicLists.length > 1
      ? publicLists.reduce((best, l) =>
          (l.viewCount ?? 0) > (best.viewCount ?? 0) ? l : best,
        )
      : null;

  return (
    <aside className={styles.statsCard} aria-label="List analytics">
      <h2 className={styles.statsHeading}>Your stats</h2>
      <dl className={styles.statsList}>
        <div className={styles.statItem}>
          <dt className={styles.statLabel}>Total views</dt>
          <dd className={styles.statValue}>{totalViews.toLocaleString()}</dd>
        </div>
        {topList && (topList.viewCount ?? 0) > 0 && (
          <div className={styles.statItem}>
            <dt className={styles.statLabel}>Most viewed</dt>
            <dd className={styles.statValue}>
              {topList.name}
              {' '}
              <span className={styles.statCount}>
                ({topList.viewCount?.toLocaleString()} views)
              </span>
            </dd>
          </div>
        )}
      </dl>
    </aside>
  );
}

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
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createListError, setCreateListError] = useState<string | null>(null);

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
  const isAtListLimit = !user?.isPro && lists.length >= FREE_LIST_LIMIT;

  const handleOpenNewList = () => {
    if (isAtListLimit) {
      router.push('/pricing');
      return;
    }
    setNewListName('');
    setIsCreatingNew(true);
    setIsRenaming(false);
    setIsConfirmingDelete(false);
    setCreateListError(null);
  };

  const handleCreateNewList = async () => {
    const name = newListName.trim();
    if (!name) return;
    setIsCreatingNew(false);
    setNewListName('');
    setCreateListError(null);
    try {
      const result = await createList({ variables: { name } });
      const newList = result.data?.createMyList;
      if (newList) setActiveListId(newList.documentId);
    } catch (err) {
      const graphqlErr = err as { graphQLErrors?: Array<{ extensions?: { code?: string } }> };
      const code = graphqlErr.graphQLErrors?.[0]?.extensions?.code;
      if (code === 'FREE_LIST_LIMIT_REACHED') {
        router.push('/pricing');
      } else {
        setCreateListError('Could not create list. Please try again.');
      }
    }
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

  const handleOpenDescription = () => {
    if (!activeList) return;
    setDescriptionValue(activeList.description ?? '');
    setIsEditingDescription(true);
    setIsRenaming(false);
    setIsConfirmingDelete(false);
  };

  const handleSaveDescription = async () => {
    const description = descriptionValue.trim() || null;
    setIsEditingDescription(false);
    await updateList({ variables: { documentId: activeList?.documentId, description } });
  };

  const handleCancelDescription = () => {
    setIsEditingDescription(false);
    setDescriptionValue('');
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

  const handleCopyLink = async () => {
    if (!activeList || !user) return;
    const url = `${window.location.origin}/list/${user.username}/${activeList.documentId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available in this context
    }
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

        <ProStatsCard lists={lists} isPro={user?.isPro ?? false} />

        {!user?.isPro && (
          <aside
            className={styles.upgradeBanner}
            aria-label="List usage"
          >
            <p className={styles.upgradeBannerText}>
              <span className={styles.listCount}>
                {lists.length}/{FREE_LIST_LIMIT} lists used
              </span>
              {lists.length >= FREE_LIST_LIMIT ? (
                <>
                  {' '}— Unlock unlimited lists with <strong>London List Pro</strong>.{' '}
                  <Link href="/pricing" className={styles.upgradeBannerLink}>
                    Upgrade now
                  </Link>
                </>
              ) : (
                <>
                  {' '}({FREE_LIST_LIMIT - lists.length} remaining on the free plan —{' '}
                  <Link href="/pricing" className={styles.upgradeBannerLink}>
                    upgrade for unlimited
                  </Link>
                  )
                </>
              )}
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
                setIsEditingDescription(false);
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
          ) : isAtListLimit ? (
            <button
              type="button"
              className={styles.tabUpgrade}
              onClick={handleOpenNewList}
              aria-label="Upgrade to Pro to create more lists"
            >
              + New list (Pro)
            </button>
          ) : (
            <button type="button" className={styles.tabNew} onClick={handleOpenNewList}>
              + New list
            </button>
          )}
        </div>

        {createListError && (
          <p className={styles.createListError} role="alert">
            {createListError}
          </p>
        )}

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
              {isEditingDescription ? (
                <form
                  className={styles.descriptionForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveDescription();
                  }}
                  aria-label="Edit list description"
                >
                  <label htmlFor="list-description" className={styles.descriptionLabel}>
                    Description{' '}
                    <span className={styles.descriptionHint}>
                      ({300 - descriptionValue.length} characters remaining)
                    </span>
                  </label>
                  <textarea
                    id="list-description"
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    className={styles.descriptionTextarea}
                    placeholder="Tell visitors what this list is about…"
                    maxLength={300}
                    rows={3}
                  />
                  <div className={styles.descriptionActions}>
                    <button type="submit" className={styles.renameSave}>
                      Save description
                    </button>
                    <button
                      type="button"
                      className={styles.renameCancel}
                      onClick={handleCancelDescription}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.descriptionRow}>
                  {activeList.description ? (
                    <p className={styles.descriptionPreview}>{activeList.description}</p>
                  ) : (
                    <p className={styles.descriptionEmpty}>No description yet.</p>
                  )}
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={handleOpenDescription}
                  >
                    {activeList.description ? 'Edit description' : 'Add description'}
                  </button>
                </div>
              )}
            </section>

            <section className={styles.section} aria-label="Share">
              <h2 className={styles.subheading}>Share</h2>
              {activeList.isPublic ? (
                <>
                  <div className={styles.shareRow}>
                    <input
                      className={styles.shareUrl}
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/list/${user.username}/${activeList.documentId}`}
                      aria-label="Public list URL"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={handleCopyLink}
                      aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}>
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                  {user?.isPro ? (
                    <p className={styles.viewCountStat}>
                      <span className={styles.viewCountNumber}>{activeList.viewCount ?? 0}</span>{' '}
                      {activeList.viewCount === 1 ? 'view' : 'views'}
                    </p>
                  ) : (
                    <p className={styles.viewCountLocked}>
                      <Link href="/pricing" className={styles.viewCountUpgradeLink}>
                        Upgrade to Pro
                      </Link>{' '}
                      to see how many times your list has been viewed.
                    </p>
                  )}
                </>
              ) : (
                <p className={styles.sharePrivate}>
                  Make this list public to share it with others.
                </p>
              )}
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
