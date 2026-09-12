import { Language } from '../types';

/**
 * Ensures any string containing Eastern Arabic digits is converted to standard Western digits (0-9)
 */
export function ensureWesternNumerals(str: string): string {
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => {
    const idx = easternDigits.indexOf(w);
    return idx !== -1 ? idx.toString() : w;
  });
}

/**
 * Format a number using standard Western Arabic digits (0-9)
 */
export function formatNumber(val: number, decimals: number = 0): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  const formatted = val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return ensureWesternNumerals(formatted);
}

/**
 * Format currency in Tunisian Dinar (TND / د.ت) strictly using Western Arabic numerals (0-9)
 */
export function formatTND(val: number, lang: Language = 'en', decimals: number = 3): string {
  if (isNaN(val) || val === null || val === undefined) val = 0;
  const numStr = formatNumber(val, decimals);
  
  if (lang === 'ar') {
    return `${numStr} د.ت`;
  } else if (lang === 'fr') {
    return `${numStr} DT`;
  }
  return `${numStr} TND`;
}

/**
 * Format date in standard YYYY-MM-DD or readable localized format with Western numerals
 */
export function formatDate(dateString: string, lang: Language = 'en'): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    // We format using standard Western digits
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    if (lang === 'ar') {
      return `${year}/${month}/${day}`;
    } else if (lang === 'fr') {
      return `${day}/${month}/${year}`;
    }
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
}

/**
 * Get current date string formatted as YYYY-MM-DD
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get Month key string (YYYY-MM)
 */
export function getMonthKey(dateString: string): string {
  if (!dateString) return '';
  return dateString.substring(0, 7);
}
