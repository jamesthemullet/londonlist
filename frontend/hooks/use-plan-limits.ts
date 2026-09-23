import { gql, useQuery } from '@apollo/client';

const GET_PLAN_LIMITS = gql`
  query GetPlanLimits {
    planLimits {
      freeListLimit
      freeItemLimit
    }
  }
`;

type PlanLimits = {
  freeListLimit: number;
  freeItemLimit: number;
};

const DEFAULT_LIMITS: PlanLimits = { freeListLimit: 3, freeItemLimit: 20 };

export function usePlanLimits(): PlanLimits {
  const { data } = useQuery<{ planLimits: PlanLimits }>(GET_PLAN_LIMITS, {
    fetchPolicy: 'cache-first',
  });
  return data?.planLimits ?? DEFAULT_LIMITS;
}
