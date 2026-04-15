import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Cookie from 'js-cookie';
import useDebounce from '../../hooks/use-debounce';
import styles from './place-search.module.css';

type NominatimResult = {
  place_id: number;
  osm_id: number;
  osm_type: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
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
      data {
        id
        attributes {
          name
        }
      }
    }
  }
`;

function shortName(displayName: string): string {
  return displayName.split(',').slice(0, 2).join(',');
}

export default function PlaceSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [createListItem] = useMutation(CREATE_LIST_ITEM);

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    const params = new URLSearchParams({
      q: debouncedQuery,
      countrycodes: 'gb',
      viewbox: '-0.51,51.69,0.33,51.29',
      bounded: '1',
      format: 'json',
      addressdetails: '0',
      limit: '10',
    });
    fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then((r) => r.json())
      .then((data: NominatimResult[]) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  async function handleAdd(result: NominatimResult) {
    const token = Cookie.get('token');
    if (!token) {
      alert('Please log in to add places to your list.');
      return;
    }
    try {
      await createListItem({
        variables: {
          osm_id: `${result.osm_type}/${result.osm_id}`,
          name: shortName(result.display_name),
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          category: result.class,
        },
        context: {
          headers: { Authorization: `Bearer ${token}` },
        },
      });
      setAdded((prev) => new Set(prev).add(result.place_id));
    } catch {
      alert('Could not add to list. Please try again.');
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

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r) => (
            <li key={r.place_id} className={styles.result}>
              <div className={styles.resultInfo}>
                <span className={styles.resultName}>{shortName(r.display_name)}</span>
                {r.type && <span className={styles.resultType}>{r.type}</span>}
              </div>
              <button
                className={styles.addButton}
                disabled={added.has(r.place_id)}
                onClick={() => handleAdd(r)}>
                {added.has(r.place_id) ? 'Added ✓' : '+ Add to list'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.length >= 3 && !searching && results.length === 0 && (
        <p className={styles.noResults}>No places found in London for &ldquo;{query}&rdquo;</p>
      )}
    </div>
  );
}
