import { format } from 'date-fns';

/**
 * Safely formats a date string or object. Returns 'N/A' if the input is invalid.
 * @param input - Date string, timestamp, or Date object
 * @param dateFormat - Format string (default: 'dd MMM, yyyy - h:mm a')
 */
export function formatDateSafe(
    input: string | number | Date | null | undefined,
    dateFormat = 'dd MMM, yyyy - h:mm a'
): string {
    if (!input) return 'N/A';
    const date = new Date(input);
    return isNaN(date.getTime()) ? 'N/A' : format(date, dateFormat);
}
