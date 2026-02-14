import { format, parse, isValid } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formats raw numeric input into "DD MM YYYY" format with automatic spacing
 * @param value - Raw input string (may contain digits and spaces)
 * @returns Formatted string with spaces between day, month, year
 */
export function formatDateInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");
  
  // Apply formatting: DD MM YYYY
  let formatted = "";
  for (let i = 0; i < digits.length && i < 8; i++) {
    if (i === 2 || i === 4) {
      formatted += " ";
    }
    formatted += digits[i];
  }
  
  return formatted;
}

/**
 * Formats raw numeric input into "HH:MM" format with automatic colon
 * @param value - Raw input string (may contain digits and colons)
 * @returns Formatted string with colon between hours and minutes
 */
export function formatTimeInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");
  
  // Apply formatting: HH:MM
  let formatted = "";
  for (let i = 0; i < digits.length && i < 4; i++) {
    if (i === 2) {
      formatted += ":";
    }
    formatted += digits[i];
  }
  
  return formatted;
}

/**
 * Parses a "DD MM YYYY" formatted string into a Date object
 * @param value - Formatted date string "DD MM YYYY"
 * @returns Date object if valid, null otherwise
 */
export function parseDateInput(value: string): Date | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);
  
  // Basic validation
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > 2100) return null;
  
  const date = new Date(year, month - 1, day);
  
  // Validate the date is actually valid (e.g., not Feb 30)
  if (!isValid(date) || date.getDate() !== day || date.getMonth() !== month - 1) {
    return null;
  }
  
  return date;
}

/**
 * Parses a "HH:MM" formatted string and validates it
 * @param value - Formatted time string "HH:MM"
 * @returns Time string if valid, null otherwise
 */
export function parseTimeInput(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 4) return null;
  
  const hours = parseInt(digits.slice(0, 2), 10);
  const minutes = parseInt(digits.slice(2, 4), 10);
  
  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;
  
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

/**
 * Converts a Date object to short display format like "Dim. 1 fév."
 * @param date - Date object
 * @returns Formatted short date string
 */
export function formatDateShort(date: Date): string {
  return format(date, "EEE d MMM", { locale: fr }).replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Converts a "DD MM YYYY" string to "dd/MM/yyyy" storage format
 * @param value - Formatted date string "DD MM YYYY"
 * @returns Date string in "dd/MM/yyyy" format, or empty string if invalid
 */
export function dateInputToStorageFormat(value: string): string {
  const date = parseDateInput(value);
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
}

/**
 * Converts a "dd/MM/yyyy" storage format to "DD MM YYYY" input format
 * @param value - Storage date string "dd/MM/yyyy"
 * @returns Date string in "DD MM YYYY" format
 */
export function storageDateToInputFormat(value: string): string {
  try {
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    if (!isValid(parsed)) return "";
    return format(parsed, "dd MM yyyy");
  } catch {
    return "";
  }
}

/**
 * Parses a "DD MM YYYY" formatted string into birth date components
 * @param value - Formatted date string "DD MM YYYY"
 * @returns Object with day, month, year or null if invalid
 */
export function parseBirthDateInput(value: string): { day: number; month: number; year: number } | null {
  const date = parseDateInput(value);
  if (!date) return null;
  
  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

/**
 * Converts birth date components to "DD MM YYYY" input format
 * @param birthDate - Object with day, month, year
 * @returns Date string in "DD MM YYYY" format
 */
export function birthDateToInputFormat(birthDate: { day: number; month: number; year: number }): string {
  const day = birthDate.day.toString().padStart(2, "0");
  const month = birthDate.month.toString().padStart(2, "0");
  const year = birthDate.year.toString();
  return `${day} ${month} ${year}`;
}

/**
 * Checks if a date input has all 8 digits (complete date)
 * @param value - Input string
 * @returns True if input contains 8 digits
 */
export function isDateInputComplete(value: string): boolean {
  return value.replace(/\D/g, "").length === 8;
}

/**
 * Checks if a time input has all 4 digits (complete time)
 * @param value - Input string
 * @returns True if input contains 4 digits
 */
export function isTimeInputComplete(value: string): boolean {
  return value.replace(/\D/g, "").length === 4;
}
