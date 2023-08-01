import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import Image from "next/image";
import Loader from "./Loader";

const QUERY = gql`
  {
    museums {
      data {
        id
        attributes {
          name
          description
          image {
            data {
              attributes {
                url
              }
            }
          }
        }
      }
    }
  }
`;

function MuseumCard({ data }) {
  return (
    <div>
      <div>
        <Image
          height={300}
          width={300}
          src={`${process.env.STRAPI_URL || "http://localhost:1337"}${
            data.attributes.image.data[0].attributes.url
          }`}
          alt=''
        />
        <div>
          <h3>{data.attributes.name}</h3>
          <p>{data.attributes.description}</p>
          <div>
            <div>
              <Link href={`/museum/${data.id}`}>View</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MuseumList(props) {
  const { loading, error, data } = useQuery(QUERY);

  if (error) return "Error loading museums";
  if (loading) return <Loader />;

  if (data.museums.data && data.museums.data.length) {
    const searchQuery = data.museums.data.filter((query) =>
      query.attributes.name.toLowerCase().includes(props.query.toLowerCase())
    );

    if (searchQuery.length != 0) {
      return (
        <div>
          <div>
            <div>
              {searchQuery.map((res) => {
                return <MuseumCard key={res.id} data={res} />;
              })}
            </div>
          </div>
        </div>
      );
    } else {
      return <h1>No Museums Found</h1>;
    }
  }
  return <h5>Add Museums</h5>;
}
export default MuseumList;
