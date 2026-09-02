import { gql } from '@apollo/client';

export type PublicPlace = {
  osm_id: string;
  name: string;
  category: string | null;
  lat: number | null;
  lng: number | null;
};

export type GetPlaceData = {
  place: PublicPlace | null;
};

export type GetPlaceVars = {
  osm_id: string;
};

export const GET_PLACE = gql`
  query GetPlace($osm_id: String!) {
    place(osm_id: $osm_id) {
      osm_id
      name
      category
      lat
      lng
    }
  }
`;

export function extractPlace(data: GetPlaceData | undefined | null): PublicPlace | null {
  return data?.place ?? null;
}
