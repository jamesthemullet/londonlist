import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Cookie from 'js-cookie';
import useDebounce from '../../hooks/use-debounce';
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
  ) {
    createListItem(
      data: {
        osm_id: $osm_id
        name: $name
        lat: $lat
        lng: $lng
        category: $category
        completed: false
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

export default function PlaceSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [addError, setAddError] = useState<string | null>(null);
  const [createListItem] = useMutation(CREATE_LIST_ITEM);

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
      .then((data: PhotonResponse) => setResults(data.features ?? []))
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
      const { errors } = await createListItem({
        variables: {
          osm_id: key,
          name: featureName(properties),
          lat: geometry.coordinates[1],
          lng: geometry.coordinates[0],
          category: properties.osm_value ?? properties.osm_key ?? '',
        },
        context: {
          headers: { Authorization: `Bearer ${token}` },
        },
        refetchQueries: ['GetMyList'],
      });
      if (errors && errors.length > 0) {
        setAddError('Could not add to list. Please try again.');
        return;
      }
      setAdded((prev) => new Set(prev).add(key));
    } catch {
      setAddError('Could not add to list. Please try again.');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search for a place in London..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && <span className={styles.spinner} />}
      </div>

      {searchError && <p className={styles.error}>{searchError}</p>}
      {addError && <p className={styles.error}>{addError}</p>}

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r) => {
            const key = `${osmTypeExpanded(r.properties.osm_type)}/${r.properties.osm_id}`;
            return (
              <li key={key} className={styles.result}>
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{featureName(r.properties)}</span>
                  {featureSubtitle(r.properties) && (
                    <span className={styles.resultSubtitle}>{featureSubtitle(r.properties)}</span>
                  )}
                  {r.properties.osm_value && (
                    <span className={styles.resultType}>{r.properties.osm_value}</span>
                  )}
                </div>
                <button
                  className={styles.addButton}
                  disabled={added.has(key)}
                  onClick={() => handleAdd(r)}>
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
