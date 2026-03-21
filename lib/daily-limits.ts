// Client-side daily usage tracking using localStorage
// Resets at midnight each day

const LIMITS = {
  askAnything: 3,
  calculator: 1,
  watchlist: 1,
} as const;

type FeatureKey = keyof typeof LIMITS;

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getUsageKey(feature: FeatureKey): string {
  return `blackmere_usage_${feature}_${getTodayKey()}`;
}

export function getUsageCount(feature: FeatureKey): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(getUsageKey(feature)) ?? '0', 10);
}

export function incrementUsage(feature: FeatureKey): void {
  if (typeof window === 'undefined') return;
  const current = getUsageCount(feature);
  localStorage.setItem(getUsageKey(feature), String(current + 1));
}

export function hasRemainingUses(feature: FeatureKey): boolean {
  return getUsageCount(feature) < LIMITS[feature];
}

export function getRemainingUses(feature: FeatureKey): number {
  return Math.max(0, LIMITS[feature] - getUsageCount(feature));
}

export function getLimit(feature: FeatureKey): number {
  return LIMITS[feature];
}
