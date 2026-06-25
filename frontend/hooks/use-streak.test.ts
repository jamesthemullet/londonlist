import { useStreak } from './use-streak';

function item(visitedAt: string | null, completed = true) {
  return { completed, visitedAt };
}

function date(year: number, month: number, day = 1): Date {
  return new Date(year, month - 1, day);
}

function iso(year: number, month: number, day = 1): string {
  return new Date(year, month - 1, day).toISOString();
}

describe('useStreak', () => {
  it('returns 0 when there are no completed items', () => {
    expect(useStreak([], date(2025, 6, 15))).toEqual({ streak: 0, atRisk: false });
  });

  it('returns 0 when completed items have no visitedAt', () => {
    const items = [item(null)];
    expect(useStreak(items, date(2025, 6, 15))).toEqual({ streak: 0, atRisk: false });
  });

  it('ignores incomplete items', () => {
    const items = [{ completed: false, visitedAt: iso(2025, 6) }];
    expect(useStreak(items, date(2025, 6, 15))).toEqual({ streak: 0, atRisk: false });
  });

  it('returns streak of 1 when only current month has a visit', () => {
    const items = [item(iso(2025, 6))];
    expect(useStreak(items, date(2025, 6, 15))).toEqual({ streak: 1, atRisk: false });
  });

  it('counts consecutive months including the current month', () => {
    const items = [item(iso(2025, 4)), item(iso(2025, 5)), item(iso(2025, 6))];
    expect(useStreak(items, date(2025, 6, 15))).toEqual({ streak: 3, atRisk: false });
  });

  it('stops counting at the first gap', () => {
    const items = [item(iso(2025, 3)), item(iso(2025, 5)), item(iso(2025, 6))];
    expect(useStreak(items, date(2025, 6, 15))).toEqual({ streak: 2, atRisk: false });
  });

  it('counts streak from last month when current month has no visit', () => {
    const items = [item(iso(2025, 4)), item(iso(2025, 5))];
    expect(useStreak(items, date(2025, 6, 10))).toEqual({ streak: 2, atRisk: false });
  });

  it('marks atRisk when current month has no visit, streak > 0, and date >= 20', () => {
    const items = [item(iso(2025, 5))];
    expect(useStreak(items, date(2025, 6, 20))).toEqual({ streak: 1, atRisk: true });
  });

  it('does not mark atRisk when date < 20', () => {
    const items = [item(iso(2025, 5))];
    expect(useStreak(items, date(2025, 6, 19))).toEqual({ streak: 1, atRisk: false });
  });

  it('does not mark atRisk when streak is 0', () => {
    expect(useStreak([], date(2025, 6, 25))).toEqual({ streak: 0, atRisk: false });
  });

  it('handles year boundaries correctly', () => {
    const items = [item(iso(2024, 11)), item(iso(2024, 12)), item(iso(2025, 1))];
    expect(useStreak(items, date(2025, 1, 15))).toEqual({ streak: 3, atRisk: false });
  });

  it('handles multiple visits in the same month as one month', () => {
    const items = [item(iso(2025, 6, 1)), item(iso(2025, 6, 10)), item(iso(2025, 6, 20))];
    expect(useStreak(items, date(2025, 6, 21))).toEqual({ streak: 1, atRisk: false });
  });
});
