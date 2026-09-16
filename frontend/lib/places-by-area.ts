import { gql } from '@apollo/client';

export type PlaceSummary = {
  osm_id: string;
  name: string;
  category: string | null;
  area: string | null;
  lat: number | null;
  lng: number | null;
};

export type GetPlacesByAreaData = {
  placesByArea: PlaceSummary[] | null;
};

export const GET_PLACES_BY_AREA = gql`
  query GetPlacesByArea($area: String!) {
    placesByArea(area: $area) {
      osm_id
      name
      category
      area
      lat
      lng
    }
  }
`;

export function extractPlacesByArea(data: GetPlacesByAreaData | undefined | null): PlaceSummary[] {
  return data?.placesByArea ?? [];
}
