export type GraphQLResultLike = {
  errors?: ReadonlyArray<{ extensions?: Record<string, unknown> }>;
};

/**
 * Extracts the first GraphQL error code from a mutation result.
 * Apollo Client v4 with errorPolicy:'all' resolves mutations with result.errors
 * rather than throwing, so errors must be read from the result, not a catch block.
 */
export function getGraphQLErrorCode(result: GraphQLResultLike): string | undefined {
  const code = result.errors?.[0]?.extensions?.code;
  return typeof code === 'string' ? code : undefined;
}
