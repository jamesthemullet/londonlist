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

export type GetRelatedPlacesData = {
  relatedPlaces: PublicPlace[];
};

export const GET_RELATED_PLACES = gql`
  query GetRelatedPlaces($osm_id: String!, $limit: Int) {
    relatedPlaces(osm_id: $osm_id, limit: $limit) {
      osm_id
      name
      category
      lat
      lng
    }
  }
`;

export function extractRelatedPlaces(data: GetRelatedPlacesData | undefined | null): PublicPlace[] {
  return data?.relatedPlaces ?? [];
}

export function buildPlaceUrl(osm_id: string): string | null {
  const idx = osm_id.indexOf('/');
  if (idx < 1 || idx === osm_id.length - 1) return null;
  return `/place/${osm_id.slice(0, idx)}/${osm_id.slice(idx + 1)}`;
}
