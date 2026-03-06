import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';

// import Image from 'next/image';
import Loader from '../../components/Loader';

type ExhibitionItem = {
  id: string;
  attributes: {
    name: string;
    description: string;
    startdate: string;
    enddate: string;
  };
};

type MuseumExhibitionsQueryData = {
  museum: {
    data: {
      id: string;
      attributes: {
        name: string;
        exhibitions: {
          data: ExhibitionItem[];
        };
      };
    } | null;
  };
};

type MuseumExhibitionsQueryVars = {
  id: string;
};

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

function ExhibitionCard({ data }: { data: ExhibitionItem }) {
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
  const museumId = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;

  const { loading, error, data } = useQuery<MuseumExhibitionsQueryData, MuseumExhibitionsQueryVars>(
    GET_MUSEUM_EXHIBITIONS,
    {
      variables: { id: museumId ?? '' },
      skip: !museumId,
    },
  );

  const exhibitions = data?.museum?.data?.attributes?.exhibitions?.data ?? [];

  if (!museumId) return <Loader />;

  if (error) return 'Error Loading Exhibitions';
  if (loading) return <Loader />;
  if (exhibitions.length) {
    const museum = data?.museum;

    if (!museum?.data) return <h1>No Exhibitions Found</h1>;

    return (
      <div>
        <h1>{museum.data.attributes.name}</h1>
        <div>
          <div>
            <div>
              {exhibitions.map((res) => {
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
