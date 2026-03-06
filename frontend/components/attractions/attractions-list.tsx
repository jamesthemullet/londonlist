import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import Loader from '../Loader';

type AttractionItem = {
  id: string;
  attributes: {
    name: string;
    description: string;
    category: string;
  };
};

type AttractionsQueryData = {
  attractions: {
    data: AttractionItem[];
  };
};

type AttractionsListProps = {
  query: string;
};

const QUERY = gql`
  {
    attractions {
      data {
        id
        attributes {
          name
          description
          category
        }
      }
    }
  }
`;

function AttractionsCard({ data }: { data: AttractionItem }) {
  return (
    <div>
      <div>
        <div>
          <h3>{data.attributes.name}</h3>
          <p>{data.attributes.description}</p>
          <p>{data.attributes.category}</p>
          <div>
            <div>
              <Link href={`/attraction/${data.id}`}>View</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttractionsList(props: AttractionsListProps) {
  const { loading, error, data } = useQuery<AttractionsQueryData>(QUERY);

  if (error) return 'Error loading attractions';
  if (loading) return <Loader />;

  if (data?.attractions?.data && data.attractions.data.length) {
    const searchQuery = data.attractions.data.filter((query) =>
      query.attributes.name.toLowerCase().includes(props.query.toLowerCase()),
    );

    if (searchQuery.length != 0) {
      return (
        <div>
          <div>
            <div>
              {searchQuery.map((res) => {
                return <AttractionsCard key={res.id} data={res} />;
              })}
            </div>
          </div>
        </div>
      );
    } else {
      return <h1>No Attractions Found</h1>;
    }
  }
}
export default AttractionsList;
