import { gql, useQuery } from '@apollo/client';
import Link from 'next/link';
import Loader from '../Loader';

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

function AttractionsCard({ data }) {
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

function AttractionsList(props) {
  const { loading, error, data } = useQuery(QUERY);

  if (error) return 'Error loading attractions';
  if (loading) return <Loader />;

  if (data.attractions.data && data.attractions.data.length) {
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
