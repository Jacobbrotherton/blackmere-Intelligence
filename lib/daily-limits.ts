type Feature = 'askAnything' | 'calculator' | 'watchlist';

function todayKey(feature: Feature): string {
  const d = new Date().toISOString().split('T')[0];
  return `bm_limit_${feature}_${d}`;
}

export function getRemainingUses(feature: Feature, limit = 1): number {
  if (typeof window === 'undefined') return limit;
  const used = parseInt(localStorage.getItem(todayKey(feature)) ?? '0', 10);
  return Math.max(0, limit - used);
}

export function hasUsesRemaining(feature: Feature, limit = 1): boolean {
  return getRemainingUses(feature, limit) > 0;
}

export function consumeUse(feature: Feature): void {
  if (typeof window === 'undefined') return;
  const key = todayKey(feature);
  const used = parseInt(localStorage.getItem(key) ?? '0', 10);
  localStorage.setItem(key, String(used + 1));
}

// Legacy aliases for backward compatibility
export const hasRemainingUses = hasUsesRemaining;
export const incrementUsage = consumeUse;
