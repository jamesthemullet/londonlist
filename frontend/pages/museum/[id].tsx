import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

// import Image from 'next/image';
import Loader from '../../components/Loader';

const GET_MUSEUM_EXHIBITIONS = gql`
  query ($id: ID!) {
    museum(id: $id) {
      data {
        id
        attributes {
          name
          exhibitions {
            data {
              id
              attributes {
                name
                description
                startdate
                enddate
              }
            }
          }
        }
      }
    }
  }
`;

function ExhibitionCard({ data }) {
  function handleAddItem() {
    // will add some logic here
  }

  return (
    <div>
      <div>
        {/* <Image
          height={300}
          width={300}
          src={`${process.env.STRAPI_URL || "http://127.0.0.1:1337"}${
            data.attributes.image?.data?.attributes?.url
          }`}
          alt=''
        /> */}
        <div>
          <a href="#">
            <h3>{data.attributes.name}</h3>
          </a>
          <p>{data.attributes.description}</p>
          <div>
            <div>
              <button onClick={handleAddItem}>+ Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Museum() {
  const router = useRouter();
  const { loading, error, data } = useQuery(GET_MUSEUM_EXHIBITIONS, {
    variables: { id: router.query.id },
  });

  if (error) return 'Error Loading Exhibitions';
  if (loading) return <Loader />;
  if (data.museum.data.attributes.exhibitions.data.length) {
    const { museum } = data;

    return (
      <div>
        <h1>{museum.data.attributes.name}</h1>
        <div>
          <div>
            <div>
              {museum.data.attributes.exhibitions.data.map((res) => {
                return <ExhibitionCard key={res.id} data={res} />;
              })}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return <h1>No Exhibitions Found</h1>;
  }
}
