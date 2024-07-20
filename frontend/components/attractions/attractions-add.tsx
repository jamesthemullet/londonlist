import { gql } from '@apollo/client';
import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import useDebounce from '../../hooks/use-debounce';

const categories = [
  'Museum',
  'Landmark',
  'Park',
  'Entertainment',
  'Cultural',
  'Art Gallery',
  'Attraction',
  'Religious Site',
  'Gardens',
  'Theatre',
  'Shopping/Market',
];

const CREATE_ATTRACTION_MUTATION = gql`
  mutation CreateAttraction(
    $name: String!
    $description: String!
    $category: ENUM_ATTRACTION_CATEGORY!
    $publishedAt: DateTime!
  ) {
    createAttraction(
      data: {
        name: $name
        description: $description
        category: $category
        publishedAt: $publishedAt
      }
    ) {
      data {
        id
        attributes {
          name
          description
          category
          publishedAt
        }
      }
    }
  }
`;

function CreateAttractionForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const debouncedAddress = useDebounce(address, 300);

  const [createAttraction, { loading, error }] = useMutation(CREATE_ATTRACTION_MUTATION, {
    onCompleted: (data) => {
      console.log('Attraction created:', data);
      // Optionally, redirect or update the UI after successful creation
    },
  });

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedAddress.length > 2) {
        // Trigger suggestions only after 3 characters
        try {
          const response = await fetch(
            `https://us1.locationiq.com/v1/autocomplete.php?key=${process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY}&q=${debouncedAddress}&format=json`,
          );
          const data = await response.json();
          setSuggestions(data);
        } catch (error) {
          console.error('Error fetching address suggestions:', error);
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedAddress]);

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    setAddress(suggestion.display_name);
    setSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const publishedAt = new Date().toISOString(); // Set current date and time
    createAttraction({ variables: { name, description, category, publishedAt } });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="address">Address</label>
        <input id="address" type="text" value={address} onChange={handleAddressChange} required />
        {suggestions.length > 0 && (
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                {suggestion.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Attraction'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}

export default CreateAttractionForm;
