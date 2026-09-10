// Timezone utility locked to GMT+7 (Asia/Jakarta / WIB)

export const JAKARTA_TIMEZONE = 'Asia/Jakarta';

/**
 * Returns a Date object adjusted to Asia/Jakarta timezone.
 */
export function getJakartaDate(d: Date | string | number = new Date()): Date {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return new Date();
  const jakartaStr = dateObj.toLocaleString('en-US', { timeZone: JAKARTA_TIMEZONE });
  return new Date(jakartaStr);
}

/**
 * Returns date string in "YYYY-MM-DD" format based on Asia/Jakarta timezone.
 */
export function getJakartaDateString(d: Date | string | number = new Date()): string {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
}

/**
 * Returns time string in "HH:mm" or "HH:mm:ss" format based on Asia/Jakarta timezone.
 */
export function getJakartaTimeString(d: Date | string | number = new Date(), includeSeconds = false): string {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '00:00';
  
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false
  }).formatToParts(dateObj);

  const hour = parts.find(p => p.type === 'hour')?.value.padStart(2, '0') || '00';
  const minute = parts.find(p => p.type === 'minute')?.value.padStart(2, '0') || '00';
  
  if (includeSeconds) {
    const second = parts.find(p => p.type === 'second')?.value.padStart(2, '0') || '00';
    return `${hour}:${minute}:${second}`;
  }
  return `${hour}:${minute}`;
}

/**
 * Returns localized Indonesian date string in Asia/Jakarta timezone.
 * e.g., "Senin, 10 September 2026"
 */
export function getJakartaFormattedDate(d: Date | string | number = new Date()): string {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);
}

/**
 * Returns hour in Asia/Jakarta (0-23).
 */
export function getJakartaHours(d: Date | string | number = new Date()): number {
  const timeStr = getJakartaTimeString(d);
  return parseInt(timeStr.split(':')[0], 10) || 0;
}

/**
 * Returns minute in Asia/Jakarta (0-59).
 */
export function getJakartaMinutes(d: Date | string | number = new Date()): number {
  const timeStr = getJakartaTimeString(d);
  return parseInt(timeStr.split(':')[1], 10) || 0;
}
