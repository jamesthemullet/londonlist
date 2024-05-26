import { gql } from '@apollo/client';
import { useState } from 'react';
import { useMutation } from '@apollo/client';

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

  const [createAttraction, { loading, error }] = useMutation(CREATE_ATTRACTION_MUTATION, {
    onCompleted: (data) => {
      console.log('Attraction created:', data);
      // Optionally, redirect or update the UI after successful creation
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const publishedAt = new Date().toISOString(); // Set current date and time
    createAttraction({ variables: { name, description, category, publishedAt } });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div>
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
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
