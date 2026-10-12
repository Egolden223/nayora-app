export type CircleCandidate = {
  userId: string;
  city: string;
  country: string;
  womenOnly: boolean;
  order: number;
};

export type PlannedCircle = {
  city: string;
  country: string;
  womenOnly: boolean;
  memberIds: string[];
  affinity: number;
};

const MIN_CIRCLE = 3;
const MAX_CIRCLE = 6;

export function circleSizes(n: number): { sizes: number[]; leftover: number } {
  if (n < MIN_CIRCLE) return { sizes: [], leftover: n };
  let g = Math.floor(n / MIN_CIRCLE);
  while (g > 0 && Math.ceil(n / g) > MAX_CIRCLE) g -= 1;
  if (g <= 0) return { sizes: [], leftover: n };
  const base = Math.floor(n / g);
  const extra = n % g;
  let sizes = Array.from({ length: g }, (_, i) => base + (i < extra ? 1 : 0));
  let leftover = 0;
  sizes = sizes.map((s) => {
    if (s > MAX_CIRCLE) {
      leftover += s - MAX_CIRCLE;
      return MAX_CIRCLE;
    }
    return s;
  });
  return { sizes, leftover };
}

export function composeCircles(
  candidates: CircleCandidate[],
  affinity: (a: string, b: string) => number,
): { circles: PlannedCircle[]; waiting: string[] } {
  const pools = new Map<string, CircleCandidate[]>();
  for (const c of candidates) {
    const key = `${c.country}|${c.city.trim().toLowerCase()}|${c.womenOnly ? "w" : "m"}`;
    pools.set(key, [...(pools.get(key) ?? []), c]);
  }
  const circles: PlannedCircle[] = [];
  const waiting: string[] = [];

  for (const pool of pools.values()) {
    const sorted = [...pool].sort((a, b) => a.order - b.order);
    const { sizes } = circleSizes(sorted.length);
    const remaining = [...sorted];
    for (const size of sizes) {
      const group: CircleCandidate[] = [remaining.shift()!];
      while (group.length < size && remaining.length) {
        let best = 0;
        let bestScore = -1;
        remaining.forEach((cand, i) => {
          const avg =
            group.reduce((s, g) => s + affinity(g.userId, cand.userId), 0) /
            group.length;
          if (avg > bestScore) {
            bestScore = avg;
            best = i;
          }
        });
        group.push(remaining.splice(best, 1)[0]);
      }
      let sum = 0;
      let pairs = 0;
      for (let i = 0; i < group.length; i++)
        for (let j = i + 1; j < group.length; j++) {
          sum += affinity(group[i].userId, group[j].userId);
          pairs++;
        }
      circles.push({
        city: group[0].city,
        country: group[0].country,
        womenOnly: group[0].womenOnly,
        memberIds: group.map((g) => g.userId),
        affinity: pairs ? Math.round(sum / pairs) : 0,
      });
    }
    for (const r of remaining) waiting.push(r.userId);
  }
  return { circles, waiting };
}

export function venueVisible(revealAt: Date | string, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(revealAt).getTime();
}
