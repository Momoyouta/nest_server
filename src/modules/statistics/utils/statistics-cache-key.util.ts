export interface BuildStatisticsCacheKeyInput {
  scope: string;
  role: string;
  tenantId: string;
  metricSet: string;
  startTime?: number;
  endTime?: number;
  extras?: Record<string, string | number | undefined>;
}

const normalizeExtras = (
  extras: Record<string, string | number | undefined> | undefined,
): string => {
  if (!extras) return 'none';
  const keys = Object.keys(extras)
    .filter((key) => extras[key] !== undefined)
    .sort();
  if (!keys.length) return 'none';
  return keys.map((key) => `${key}:${String(extras[key])}`).join('|');
};

export const buildStatisticsCacheKey = (
  input: BuildStatisticsCacheKeyInput,
): string => {
  const start = input.startTime ?? 0;
  const end = input.endTime ?? 0;
  const extras = normalizeExtras(input.extras);
  return [
    'statistics',
    input.scope,
    input.role,
    input.tenantId,
    input.metricSet,
    `${start}-${end}`,
    extras,
  ].join(':');
};
