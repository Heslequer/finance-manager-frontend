export function truncate(
  value: string | null | undefined,
  maxLength: number = 50,
  suffix: string = '...'
): string {
  if (value == null || typeof value !== 'string') return '';
  if (maxLength <= 0) return '';
  if (value.length <= maxLength) return value;
  const take = Math.max(0, maxLength - suffix.length);
  return value.slice(0, take).trimEnd() + suffix;
}
