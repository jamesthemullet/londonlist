type StreakItem = {
  completed: boolean;
  visitedAt: string | null;
};

export type StreakResult = {
  streak: number;
  atRisk: boolean;
};

function prevMonth(y: number, m: number): [number, number] {
  return m === 1 ? [y - 1, 12] : [y, m - 1];
}

function monthKey(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function useStreak(items: StreakItem[], now = new Date()): StreakResult {
  const visitedMonths = new Set<string>();
  for (const item of items) {
    if (item.completed && item.visitedAt) {
      const d = new Date(item.visitedAt);
      visitedMonths.add(monthKey(d.getFullYear(), d.getMonth() + 1));
    }
  }

  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  const currentMonthVisited = visitedMonths.has(monthKey(cy, cm));

  let [wy, wm] = currentMonthVisited ? [cy, cm] : prevMonth(cy, cm);
  let streak = 0;
  while (visitedMonths.has(monthKey(wy, wm))) {
    streak++;
    [wy, wm] = prevMonth(wy, wm);
  }

  const atRisk = !currentMonthVisited && streak > 0 && now.getDate() >= 20;

  return { streak, atRisk };
}
