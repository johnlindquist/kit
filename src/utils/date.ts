// Simple date utility functions to replace date-fns

/**
 * Format the distance from now to the given date
 * @param date - The date to calculate distance from
 * @param options - Options for formatting
 * @returns The formatted distance
 */
export function formatDistanceToNow(date: Date, options: { addSuffix?: boolean } = {}): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 5) {
    return 'less than 5 seconds';
  }
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'}`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'}`;
}

/**
 * Compare two dates
 * @param dateLeft - The first date to compare
 * @param dateRight - The second date to compare
 * @returns -1 if dateLeft is before dateRight, 1 if dateLeft is after dateRight, 0 if they are equal
 */
export function compareAsc(dateLeft: Date, dateRight: Date): number {
  const diff = dateLeft.getTime() - dateRight.getTime();
  return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

/**
 * Format a date according to the specified format string
 * Supports a subset of date-fns format tokens:
 * - yyyy: 4-digit year
 * - MM: month (01-12)
 * - MMM: month name (Jan-Dec)
 * - dd: day of month (01-31)
 * - eo: ordinal day (1st, 2nd, etc)
 * - HH: hours (00-23)
 * - mm: minutes (00-59)
 * - ss: seconds (00-59)
 * - a: am/pm
 */
export function format(date: Date | number | string, formatStr: string): string {
  const d = new Date(date);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  const tokens: Record<string, () => string> = {
    'yyyy': () => d.getFullYear().toString(),
    'MM': () => (d.getMonth() + 1).toString().padStart(2, '0'),
    'MMM': () => months[d.getMonth()],
    'MMMM': () => fullMonths[d.getMonth()],
    'dd': () => d.getDate().toString().padStart(2, '0'),
    'eo': () => getOrdinal(d.getDate()),
    'HH': () => d.getHours().toString().padStart(2, '0'),
    'hh': () => (d.getHours() % 12 || 12).toString().padStart(2, '0'),
    'mm': () => d.getMinutes().toString().padStart(2, '0'),
    'ss': () => d.getSeconds().toString().padStart(2, '0'),
    'a': () => d.getHours() < 12 ? 'am' : 'pm',
    'aaa': () => d.getHours() < 12 ? 'a.m.' : 'p.m.'
  };
  
  // Replace tokens in the format string
  let result = formatStr;
  for (const [token, fn] of Object.entries(tokens)) {
    result = result.replace(new RegExp(token, 'g'), fn);
  }
  
  return result;
}

/**
 * Parse an ISO date string into a Date object
 */
export function parseISO(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Format the distance from now to the given date in a more concise format
 * @param date - The date to calculate distance from
 * @param options - Options for formatting
 * @returns The formatted distance in a concise format
 */
export function formatDistanceToNowStrict(date: Date, options: { addSuffix?: boolean } = {}): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 0) {
    return 'in the future';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);
  
  let result = '';
  
  if (diffInYears > 0) {
    result = `${diffInYears}y`;
  } else if (diffInMonths > 0) {
    result = `${diffInMonths}mo`;
  } else if (diffInDays > 0) {
    result = `${diffInDays}d`;
  } else if (diffInHours > 0) {
    result = `${diffInHours}h`;
  } else if (diffInMinutes > 0) {
    result = `${diffInMinutes}m`;
  } else {
    result = `${diffInSeconds}s`;
  }
  
  return options.addSuffix ? `${result} ago` : result;
} 