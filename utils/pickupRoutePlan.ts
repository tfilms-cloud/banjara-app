/** Demo pickup routing — nearest-neighbour order with estimated distance/duration. */

export type PickupStop = {
  id: string;
  customerName: string;
  location: string;
  seat?: string;
  phone?: string;
};

export type PlannedPickup = PickupStop & {
  order: number;
  distanceKm: number;
  durationMin: number;
  fromLabel: string;
};

function hashDistance(a: string, b: string): number {
  const raw = `${a.trim().toLowerCase()}|${b.trim().toLowerCase()}`;
  let h = 0;
  for (let i = 0; i < raw.length; i += 1) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
  return 1.2 + (h % 180) / 10;
}

/**
 * Build an ordered pickup plan starting from the driver's current / trip origin.
 * Picks the nearest remaining stop each time (greedy TSP).
 */
export function planPickupRoute(
  driverLocation: string,
  stops: PickupStop[]
): { plan: PlannedPickup[]; totalKm: number; totalMin: number } {
  if (!stops.length) return { plan: [], totalKm: 0, totalMin: 0 };

  const remaining = [...stops];
  const plan: PlannedPickup[] = [];
  let current = driverLocation.trim() || 'Current location';
  let totalKm = 0;
  let totalMin = 0;

  while (remaining.length) {
    let bestIdx = 0;
    let bestKm = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i += 1) {
      const km = hashDistance(current, remaining[i].location);
      if (km < bestKm) {
        bestKm = km;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    const durationMin = Math.max(3, Math.round(bestKm * 2.4));
    totalKm += bestKm;
    totalMin += durationMin;
    plan.push({
      ...next,
      order: plan.length + 1,
      distanceKm: Math.round(bestKm * 10) / 10,
      durationMin,
      fromLabel: current,
    });
    current = next.location;
  }

  return {
    plan,
    totalKm: Math.round(totalKm * 10) / 10,
    totalMin,
  };
}
