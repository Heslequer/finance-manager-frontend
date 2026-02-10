/**
 * Truncates a string to a maximum number of characters.
 * When truncated, appends the suffix (e.g. '...') so the total visible length does not exceed maxLength.
 *
 * @param value - String to truncate (null/undefined treated as '')
 * @param maxLength - Maximum number of characters to show (default 50)
 * @param suffix - Text appended when truncated (default '...'); its length is included in maxLength
 * @returns Truncated string
 *
 * @example
 * truncate('Lorem ipsum dolor sit amet', 10)      // 'Lorem i...'
 * truncate('Short', 20)                           // 'Short' (unchanged)
 * truncate('Hello world', 8, '…')                 // 'Hello …'
 */
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
