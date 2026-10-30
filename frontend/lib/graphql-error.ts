import { CombinedGraphQLErrors } from '@apollo/client/errors';

type MutationResultLike = {
  error?: unknown;
};

/**
 * Extracts the first GraphQL error code from a mutation result.
 * Apollo Client v4 with errorPolicy:'all' resolves mutations with result.error
 * rather than throwing, so errors must be read from the result, not a catch block.
 */
export function getGraphQLErrorCode(result: MutationResultLike): string | undefined {
  if (!CombinedGraphQLErrors.is(result.error)) return undefined;
  const code = result.error.errors[0]?.extensions?.code;
  return typeof code === 'string' ? code : undefined;
}
