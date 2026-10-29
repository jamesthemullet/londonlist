import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Link from 'next/link';
import Cookie from 'js-cookie';
import { useEffect, useState } from 'react';
import { useAuthHeader } from '../../hooks/use-auth-header';
import useDebounce from '../../hooks/use-debounce';
import { getGraphQLErrorCode } from '../../lib/graphql-error';
import styles from './place-search.module.css';

type PhotonFeature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    osm_id: number;
    osm_type: 'N' | 'W' | 'R';
    name?: string;
    street?: string;
    district?: string;
    city?: string;
    country?: string;
    osm_key?: string;
    osm_value?: string;
  };
};

type PhotonResponse = {
  features: PhotonFeature[];
};

const CREATE_LIST_ITEM = gql`
  mutation CreateListItem(
    $osm_id: String!
    $name: String!
    $lat: Float
    $lng: Float
    $category: String
    $area: String
    $list: ID
  ) {
    createListItem(
      data: {
        osm_id: $osm_id
        name: $name
        lat: $lat
        lng: $lng
        category: $category
        area: $area
        completed: false
        list: $list
      }
    ) {
      documentId
      name
    }
  }
`;

function featureName(props: PhotonFeature['properties']): string {
  return props.name ?? props.street ?? '';
}

function featureSubtitle(props: PhotonFeature['properties']): string {
  const parts = [props.street, props.district, props.city].filter(Boolean);
  if (props.name && parts.length) return parts.slice(0, 3).join(', ');
  return parts.slice(1, 3).join(', ');
}

function osmTypeExpanded(short: string): string {
  if (short === 'N') return 'node';
  if (short === 'W') return 'way';
  if (short === 'R') return 'relation';
  return short.toLowerCase();
}

type Props = {
  /** Visible label rendered as a tab above a large search box; otherwise the label is screen-reader only */
  label?: string;
  listId?: string;
  itemCount?: number;
  isPro?: boolean;
  freeItemLimit?: number;
  onLimitReached?: () => void;
};

export default function PlaceSearch({ label, listId, itemCount, isPro, freeItemLimit = 20, onLimitReached }: Props) {
  const isAtItemLimit = !isPro && itemCount !== undefined && itemCount >= freeItemLimit;
  const authHeader = useAuthHeader();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [addError, setAddError] = useState<string | null>(null);
  type CreateListItemData = { createListItem: { documentId: string; name: string } | null };
  const [createListItem] = useMutation<CreateListItemData>(CREATE_LIST_ITEM);

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort('timeout'), 5000);

    setSearching(true);
    setSearchError(null);
    const params = new URLSearchParams({
      q: debouncedQuery,
      limit: '10',
      lang: 'en',
      bbox: '-0.51,51.29,0.33,51.69',
    });
    fetch(`https://photon.komoot.io/api/?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: PhotonResponse) => {
        const seen = new Set<string>();
        const deduped = (data.features ?? []).filter((f) => {
          const key = `${osmTypeExpanded(f.properties.osm_type)}/${f.properties.osm_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setResults(deduped);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') {
          setSearchError('Search timed out. Please try again.');
        }
        setResults([]);
      })
      .finally(() => setSearching(false));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [debouncedQuery]);

  async function handleAdd(feature: PhotonFeature) {
    setAddError(null);
    const token = Cookie.get('token');
    if (!token) {
      setAddError('Please log in to add places to your list.');
      return;
    }
    const { properties, geometry } = feature;
    const osmType = osmTypeExpanded(properties.osm_type);
    const key = `${osmType}/${properties.osm_id}`;
    try {
      const result = await createListItem({
        variables: {
          osm_id: key,
          name: featureName(properties),
          lat: geometry.coordinates[1],
          lng: geometry.coordinates[0],
          category: properties.osm_value ?? properties.osm_key ?? '',
          area: properties.district ?? null,
          list: listId,
        },
        context: {
          headers: authHeader,
        },
        refetchQueries: ['GetMyList'],
      });
      const errCode = getGraphQLErrorCode(result);
      if (errCode === 'FREE_ITEM_LIMIT_REACHED') {
        if (onLimitReached) onLimitReached();
      } else if (errCode || !result.data?.createListItem) {
        setAddError('Could not add to list. Please try again.');
      } else {
        setAdded((prev) => new Set(prev).add(key));
      }
    } catch {
      setAddError('Could not add to list. Please try again.');
    }
  }

  if (isAtItemLimit) {
    return (
      <div className={styles.container}>
        <div
          className={styles.limitBanner}
          role="status"
          aria-label={`${freeItemLimit} of ${freeItemLimit} places used — upgrade required`}
        >
          <span className={styles.limitCounter} aria-hidden="true">
            {freeItemLimit}/{freeItemLimit} places
          </span>
          <p className={styles.limitText}>
            You&apos;ve reached the {freeItemLimit}-place limit on the free plan.{' '}
            <Link href="/pricing" className={styles.upgradeLink}>
              Upgrade to Pro
            </Link>{' '}
            for unlimited places per list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${label ? styles.prominent : ''}`}>
      {!isPro && itemCount !== undefined && (
        <p className={styles.itemCounter}>
          {itemCount}/{freeItemLimit} places on free plan
        </p>
      )}
      <label htmlFor="place-search-input" className={label ? styles.labelTab : styles.srOnly}>
        {label ?? 'Search for a place in London'}
      </label>
      <div className={styles.inputWrapper}>
        <input
          id="place-search-input"
          className={styles.input}
          type="text"
          placeholder="Search for a place in London..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && <span className={styles.spinner} aria-hidden="true" />}
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {searching && query.length >= 3 && 'Searching…'}
        {!searching && query.length >= 3 && results.length > 0 &&
          `${results.length} result${results.length === 1 ? '' : 's'} found`}
        {!searching && query.length >= 3 && results.length === 0 &&
          `No places found in London for ${query}`}
      </div>

      {searchError && <p role="alert" className={styles.error}>{searchError}</p>}
      {addError && <p role="alert" className={styles.error}>{addError}</p>}

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r) => {
            const key = `${osmTypeExpanded(r.properties.osm_type)}/${r.properties.osm_id}`;
            const subtitle = featureSubtitle(r.properties);
            return (
              <li key={key} className={styles.result}>
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{featureName(r.properties)}</span>
                  {subtitle && (
                    <span className={styles.resultSubtitle}>{subtitle}</span>
                  )}
                </div>
                <span className={styles.resultType}>{r.properties.osm_value}</span>
                <button
                  type="button"
                  className={styles.addButton}
                  aria-label={added.has(key) ? `Added ${featureName(r.properties)} to list` : `Add ${featureName(r.properties)} to list`}
                  disabled={added.has(key)}
                  onClick={() => handleAdd(r)}
                >
                  {added.has(key) ? 'Added ✓' : '+ Add to list'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {query.length >= 3 && !searching && results.length === 0 && (
        <p className={styles.noResults}>No places found in London for &ldquo;{query}&rdquo;</p>
      )}
    </div>
  );
}
