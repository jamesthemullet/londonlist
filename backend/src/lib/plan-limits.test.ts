import { FREE_LIST_LIMIT, FREE_ITEM_LIMIT } from './plan-limits';

describe('plan-limits', () => {
  it('exports FREE_LIST_LIMIT as 3', () => {
    expect(FREE_LIST_LIMIT).toBe(3);
  });

  it('exports FREE_ITEM_LIMIT as 20', () => {
    expect(FREE_ITEM_LIMIT).toBe(20);
  });
});
