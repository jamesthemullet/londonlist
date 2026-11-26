import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import ListVisibilityToggle from '../components/list-visibility-toggle/list-visibility-toggle';
import MyList from '../components/my-list/my-list';
import PlaceSearch from '../components/search/place-search';
import ShareButtons from '../components/share-buttons/share-buttons';
import UpgradeModal from '../components/upgrade-modal/upgrade-modal';
import WelcomeChecklist from '../components/welcome-checklist/welcome-checklist';
import { useAppContext } from '../context/AppContext';
import { useAuthHeader } from '../hooks/use-auth-header';
import { usePlanLimits } from '../hooks/use-plan-limits';
import { getGraphQLErrorCode } from '../lib/graphql-error';
import { SITE_URL } from '../lib/site';
import styles from './my-list.module.css';

type List = {
  documentId: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  viewCount: number;
  itemCount: number;
  completedCount: number;
};

type MyListsData = {
  myLists: List[];
};

const LIST_FIELDS_FRAGMENT = gql`
  fragment ListFields on ListEntity {
    documentId
    name
    description
    isPublic
    viewCount
  }
`;

export const GET_MY_LISTS = gql`
  query GetMyLists {
    myLists {
      ...ListFields
      itemCount
      completedCount
    }
  }
  ${LIST_FIELDS_FRAGMENT}
`;

const CREATE_MY_LIST = gql`
  mutation CreateMyList($name: String!) {
    createMyList(name: $name) {
      ...ListFields
    }
  }
  ${LIST_FIELDS_FRAGMENT}
`;

const UPDATE_MY_LIST = gql`
  mutation UpdateMyList($documentId: ID!, $name: String, $isPublic: Boolean, $description: String) {
    updateMyList(documentId: $documentId, name: $name, isPublic: $isPublic, description: $description) {
      ...ListFields
    }
  }
  ${LIST_FIELDS_FRAGMENT}
`;

const DELETE_MY_LIST = gql`
  mutation DeleteMyList($documentId: ID!) {
    deleteMyList(documentId: $documentId)
  }
`;

function ProStatsCard({ lists, isPro }: { lists: List[]; isPro: boolean }) {
  const publicLists = lists.filter((l) => l.isPublic);
  const hasPublicLists = publicLists.length > 0;
  const totalItems = lists.reduce((sum, l) => sum + (l.itemCount ?? 0), 0);

  if (!isPro && !hasPublicLists) return null;
  if (isPro && !hasPublicLists && totalItems === 0) return null;

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

  const totalCompleted = lists.reduce((sum, l) => sum + (l.completedCount ?? 0), 0);
  const completionRate = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
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
        {totalItems > 0 && (
          <div className={styles.statItem}>
            <dt className={styles.statLabel}>Places saved</dt>
            <dd className={styles.statValue}>{totalItems.toLocaleString()}</dd>
          </div>
        )}
        {totalItems > 0 && (
          <div className={styles.statItem}>
            <dt className={styles.statLabel}>Completed</dt>
            <dd className={styles.statValue}>
              {totalCompleted.toLocaleString()}
              {' '}
              <span className={styles.statCount}>({completionRate}%)</span>
            </dd>
          </div>
        )}
        {hasPublicLists && (
          <div className={styles.statItem}>
            <dt className={styles.statLabel}>Total views</dt>
            <dd className={styles.statValue}>{totalViews.toLocaleString()}</dd>
          </div>
        )}
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checklistDismissed, setChecklistDismissed] = useState(false);

  const newListInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialized && user === null) {
      router.push('/login');
    }
  }, [initialized, user, router]);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('onboarding-checklist-dismissed');
      if (dismissed === '1') setChecklistDismissed(true);
    } catch {
      // localStorage not available (private browsing, etc.)
    }
  }, []);

  const handleChecklistDismiss = () => {
    setChecklistDismissed(true);
    try {
      localStorage.setItem('onboarding-checklist-dismissed', '1');
    } catch {
      // localStorage not available
    }
  };

  const { freeListLimit, freeItemLimit } = usePlanLimits();

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
  const isAtListLimit = !user?.isPro && lists.length >= freeListLimit;
  const activeItemCount = activeList?.itemCount ?? 0;

  const handleOpenNewList = () => {
    if (isAtListLimit) {
      setShowUpgradeModal(true);
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
      const errCode = getGraphQLErrorCode(result);
      if (errCode === 'FREE_LIST_LIMIT_REACHED') {
        setShowUpgradeModal(true);
      } else if (errCode || !result.data?.createMyList) {
        setCreateListError('Could not create list. Please try again.');
      } else {
        setActiveListId(result.data.createMyList.documentId);
      }
    } catch {
      setCreateListError('Could not create list. Please try again.');
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

  const isPro = user.isPro ?? false;
  const publicListUrl = activeList
    ? `${SITE_URL}/list/${user.username}/${activeList.documentId}`
    : '';
  const usagePips = Array.from({ length: freeListLimit }, (_, i) => i < lists.length);

  const listHeader = activeList && (
    <div className={styles.listHeader}>
      <div className={styles.listHeaderRow}>
        <div className={styles.listTitleBlock}>
          {isRenaming ? (
            <form
              className={styles.inlineForm}
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveRename();
              }}
              aria-label={`Rename list "${activeList.name}"`}
            >
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
              <div className={styles.buttonGroup}>
                <button
                  type="submit"
                  className={styles.buttonPrimary}
                  disabled={!renameValue.trim()}
                >
                  Save
                </button>
                <button type="button" className={styles.button} onClick={handleCancelRename}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <h2 className={styles.listName}>{activeList.name}</h2>
          )}

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
              <div className={styles.buttonGroup}>
                <button type="submit" className={styles.buttonPrimary}>
                  Save description
                </button>
                <button type="button" className={styles.button} onClick={handleCancelDescription}>
                  Cancel
                </button>
              </div>
            </form>
          ) : activeList.description ? (
            <p className={styles.description}>{activeList.description}</p>
          ) : (
            <p className={styles.descriptionEmpty}>No description yet.</p>
          )}
        </div>

        {!isRenaming && !isEditingDescription && (
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.button} onClick={handleOpenRename}>
              Rename
            </button>
            <button type="button" className={styles.button} onClick={handleOpenDescription}>
              {activeList.description ? 'Edit description' : 'Add description'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const listSettings = activeList && (
    <>
      <section className={styles.panel} aria-labelledby="visibility-heading">
        <h3 id="visibility-heading" className={styles.panelHeading}>
          Visibility
        </h3>
        <ListVisibilityToggle
          isPublic={activeList.isPublic}
          onToggle={handleToggleVisibility}
          listName={activeList.name}
        />
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
                aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
            <div className={styles.shareButtons}>
              <ShareButtons
                url={publicListUrl}
                title={`${activeList.name} — ${user.username}'s London List`}
                showCopyLink={false}
              />
            </div>
            {isPro ? (
              <p className={styles.panelText}>
                <span className={styles.viewCountNumber}>{activeList.viewCount ?? 0}</span>{' '}
                {activeList.viewCount === 1 ? 'view' : 'views'}
              </p>
            ) : (
              <p className={styles.panelText}>
                <Link href="/pricing" className={styles.inlineLink}>
                  Upgrade to Pro
                </Link>{' '}
                to see how many times your list has been viewed.
              </p>
            )}
          </>
        ) : (
          <p className={styles.panelText}>
            Only you can see this list. Make this list public to share it with others.
          </p>
        )}
      </section>

      <div className={styles.dangerZone}>
        {isConfirmingDelete ? (
          <div
            className={styles.deleteConfirm}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-heading"
          >
            <p id="delete-confirm-heading" className={styles.deleteConfirmText}>
              Delete &quot;{activeList.name}&quot;? This cannot be undone.
            </p>
            <div className={styles.buttonGroup}>
              <button type="button" className={styles.buttonPrimary} onClick={handleConfirmDelete}>
                Yes, delete
              </button>
              <button type="button" className={styles.button} onClick={handleCancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          lists.length > 1 && (
            <button type="button" className={styles.deleteLink} onClick={handleOpenDeleteConfirm}>
              Delete this list
            </button>
          )
        )}
      </div>
    </>
  );

  return (
    <>
      <Head>
        <title>My Lists — London List</title>
        <meta name="description" content="Your London to-do lists" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>My Lists</h1>
          {!isPro && (
            <section className={styles.usage} aria-label="List usage">
              <span className={styles.usageCount}>
                {lists.length}/{freeListLimit} lists used
              </span>
              <span className={styles.usagePips} aria-hidden="true">
                {usagePips.map((used, i) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: pips are positional and never reorder
                    key={i}
                    className={used ? styles.pipUsed : styles.pip}
                  />
                ))}
              </span>
              <Link href="/pricing" className={styles.inlineLink}>
                {lists.length >= freeListLimit ? 'Upgrade now' : 'Upgrade for unlimited'}
              </Link>
            </section>
          )}
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Your lists">
          {lists.map((list) => (
            <button
              key={list.documentId}
              id={`tab-${list.documentId}`}
              type="button"
              role="tab"
              aria-selected={list.documentId === activeListId}
              className={list.documentId === activeListId ? styles.tabActive : styles.tab}
              onClick={() => {
                setActiveListId(list.documentId);
                setIsRenaming(false);
                setIsEditingDescription(false);
                setIsConfirmingDelete(false);
              }}
            >
              {list.name}
              <span className={styles.tabCount} aria-hidden="true">
                {list.itemCount ?? 0}
              </span>
            </button>
          ))}
          {isCreatingNew ? (
            <form
              className={styles.newListForm}
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateNewList();
              }}
              aria-label="Create new list"
            >
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
                className={styles.buttonPrimary}
                disabled={!newListName.trim()}
              >
                Create
              </button>
              <button type="button" className={styles.button} onClick={handleCancelNewList}>
                Cancel
              </button>
            </form>
          ) : isAtListLimit ? (
            <button
              type="button"
              className={styles.tabNew}
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
          <div role="tabpanel" aria-labelledby={`tab-${activeListId}`}>
            <MyList
              listId={activeList.documentId}
              listName={activeList.name}
              shareUrl={activeList.isPublic ? publicListUrl : undefined}
              header={listHeader}
              search={
                <PlaceSearch
                  label="Add a place"
                  listId={activeList.documentId}
                  itemCount={activeItemCount}
                  isPro={isPro}
                  freeItemLimit={freeItemLimit}
                  onLimitReached={() => setShowUpgradeModal(true)}
                />
              }
              sidebarTop={
                <>
                  {!checklistDismissed && (
                    <WelcomeChecklist
                      hasAddedPlace={lists.some((l) => l.itemCount > 0)}
                      hasPublicList={lists.some((l) => l.isPublic)}
                      hasMultipleLists={lists.length > 1}
                      isPro={isPro}
                      onDismiss={handleChecklistDismiss}
                    />
                  )}
                  <ProStatsCard lists={lists} isPro={isPro} />
                </>
              }
              sidebarBottom={listSettings}
            />
          </div>
        )}
      </div>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}
