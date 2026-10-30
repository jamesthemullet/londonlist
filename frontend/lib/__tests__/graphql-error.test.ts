import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { getGraphQLErrorCode } from '../graphql-error';

const graphQLError = (...errors: Array<{ extensions?: Record<string, unknown> }>) =>
  new CombinedGraphQLErrors({ errors: errors.map((e) => ({ message: 'Failed', ...e })) });

describe('getGraphQLErrorCode', () => {
  it('returns the error code from a resolved mutation result', () => {
    const result = {
      data: null,
      error: graphQLError({ extensions: { code: 'FREE_LIST_LIMIT_REACHED' } }),
    };
    expect(getGraphQLErrorCode(result)).toBe('FREE_LIST_LIMIT_REACHED');
  });

  it('returns the code from the first error when multiple are present', () => {
    const result = {
      error: graphQLError(
        { extensions: { code: 'FIRST_ERROR' } },
        { extensions: { code: 'SECOND_ERROR' } },
      ),
    };
    expect(getGraphQLErrorCode(result)).toBe('FIRST_ERROR');
  });

  it('returns undefined when there is no error', () => {
    expect(getGraphQLErrorCode({})).toBeUndefined();
  });

  it('returns undefined when the errors array is empty', () => {
    expect(getGraphQLErrorCode({ error: graphQLError() })).toBeUndefined();
  });

  it('returns undefined when an error has no extensions', () => {
    expect(getGraphQLErrorCode({ error: graphQLError({}) })).toBeUndefined();
  });

  it('returns undefined when the code is not a string', () => {
    const result = { error: graphQLError({ extensions: { code: 42 } }) };
    expect(getGraphQLErrorCode(result)).toBeUndefined();
  });

  it('returns undefined for a non-GraphQL error', () => {
    expect(getGraphQLErrorCode({ error: new Error('Network down') })).toBeUndefined();
  });

});
