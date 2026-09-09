import { getMilestoneCrossed } from '../../../components/my-list/my-list';

describe('getMilestoneCrossed', () => {
  it('returns null when total is 0', () => {
    expect(getMilestoneCrossed(0, 0, 0)).toBeNull();
  });

  it('returns null when no milestone threshold was crossed', () => {
    // Going from 2→3 of 8 does not cross 25% (threshold=2, prev already at it)
    expect(getMilestoneCrossed(2, 3, 8)).toBeNull();
  });

  it('detects the 25% milestone — crossing threshold of 2 in a list of 8', () => {
    // ceil(25% × 8) = 2; prev=1 is below, new=2 meets it
    expect(getMilestoneCrossed(1, 2, 8)).toBe(25);
  });

  it('detects the 50% milestone — crossing threshold of 4 in a list of 8', () => {
    expect(getMilestoneCrossed(3, 4, 8)).toBe(50);
  });

  it('detects the 75% milestone — crossing threshold of 6 in a list of 8', () => {
    expect(getMilestoneCrossed(5, 6, 8)).toBe(75);
  });

  it('detects the 100% milestone — all 8 of 8 items done', () => {
    expect(getMilestoneCrossed(7, 8, 8)).toBe(100);
  });

  it('returns the lowest milestone when multiple thresholds are crossed at once', () => {
    // Jumping from 0 to 4 of 4: all 25/50/75/100 thresholds crossed — returns 25 first
    expect(getMilestoneCrossed(0, 4, 4)).toBe(25);
  });

  it('returns null when done count decreased (un-checking a place)', () => {
    expect(getMilestoneCrossed(4, 3, 8)).toBeNull();
  });

  it('returns null when done count stays the same', () => {
    expect(getMilestoneCrossed(4, 4, 8)).toBeNull();
  });

  it('detects 25% on a list of 4 items — threshold is 1', () => {
    // ceil(25% × 4) = 1; prev=0, new=1
    expect(getMilestoneCrossed(0, 1, 4)).toBe(25);
  });

  it('returns 25 for a single-item list (all milestones share threshold=1)', () => {
    // All thresholds collapse to 1; 25 is detected first
    expect(getMilestoneCrossed(0, 1, 1)).toBe(25);
  });

  it('does not re-trigger a milestone if the previous count was already at the threshold', () => {
    // Going 6→7 of 8: 75% threshold=6, prev=6 is NOT below it → no crossing
    expect(getMilestoneCrossed(6, 7, 8)).toBeNull();
  });

  it('detects 100% on a 10-item list — threshold is 10', () => {
    expect(getMilestoneCrossed(9, 10, 10)).toBe(100);
  });
});
