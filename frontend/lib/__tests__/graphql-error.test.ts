import { getGraphQLErrorCode } from '../graphql-error';

describe('getGraphQLErrorCode', () => {
  it('returns the error code from a resolved mutation result', () => {
    const result = {
      data: null,
      errors: [{ extensions: { code: 'FREE_LIST_LIMIT_REACHED' } }],
    };
    expect(getGraphQLErrorCode(result)).toBe('FREE_LIST_LIMIT_REACHED');
  });

  it('returns the code from the first error when multiple are present', () => {
    const result = {
      errors: [
        { extensions: { code: 'FIRST_ERROR' } },
        { extensions: { code: 'SECOND_ERROR' } },
      ],
    };
    expect(getGraphQLErrorCode(result)).toBe('FIRST_ERROR');
  });

  it('returns undefined when there are no errors', () => {
    expect(getGraphQLErrorCode({ data: { createMyList: { documentId: 'x' } } })).toBeUndefined();
  });

  it('returns undefined when errors array is empty', () => {
    expect(getGraphQLErrorCode({ errors: [] })).toBeUndefined();
  });

  it('returns undefined when an error has no extensions', () => {
    const result = { errors: [{}] };
    expect(getGraphQLErrorCode(result)).toBeUndefined();
  });

  it('returns undefined when the code is not a string', () => {
    const result = { errors: [{ extensions: { code: 42 } }] };
    expect(getGraphQLErrorCode(result)).toBeUndefined();
  });

  it('returns undefined for a plain success result', () => {
    expect(getGraphQLErrorCode({})).toBeUndefined();
  });
});
