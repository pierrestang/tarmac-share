import { format, parse, isValid } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formats raw numeric input into "DD MM" format with automatic spacing (for trajet dates)
 */
export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  let formatted = "";
  for (let i = 0; i < digits.length && i < 4; i++) {
    if (i === 2) formatted += " ";
    formatted += digits[i];
  }
  return formatted;
}

/**
 * Formats raw numeric input into "DD MM YYYY" format with automatic spacing (for birth dates)
 */
export function formatBirthDateInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  let formatted = "";
  for (let i = 0; i < digits.length && i < 8; i++) {
    if (i === 2 || i === 4) formatted += " ";
    formatted += digits[i];
  }
  return formatted;
}

/**
 * Formats raw numeric input into "HH:MM" format with automatic colon
 */
export function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  let formatted = "";
  for (let i = 0; i < digits.length && i < 4; i++) {
    if (i === 2) formatted += ":";
    formatted += digits[i];
  }
  return formatted;
}

/**
 * Parses a "DD MM" or "DD MM YYYY" formatted string into a Date object
 */
export function parseDateInput(value: string): Date | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 4 && digits.length !== 8) return null;
  
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  
  let year: number;
  if (digits.length === 8) {
    year = parseInt(digits.slice(4, 8), 10);
    if (year < 1900 || year > 2100) return null;
  } else {
    const now = new Date();
    const currentYear = now.getFullYear();
    const candidate = new Date(currentYear, month - 1, day);
    if (isValid(candidate) && candidate.getDate() === day && candidate.getMonth() === month - 1) {
      const today = new Date(currentYear, now.getMonth(), now.getDate());
      year = candidate >= today ? currentYear : currentYear + 1;
    } else {
      year = currentYear + 1;
    }
  }
  
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;
  
  const date = new Date(year, month - 1, day);
  if (!isValid(date) || date.getDate() !== day || date.getMonth() !== month - 1) return null;
  
  return date;
}

/**
 * Parses a "HH:MM" formatted string and validates it
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
 */
export function formatDateShort(date: Date): string {
  return format(date, "EEE d MMM", { locale: fr }).replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Converts a "DD MM" string to "dd/MM/yyyy" storage format (trajet dates)
 */
export function dateInputToStorageFormat(value: string): string {
  const date = parseDateInput(value);
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
}

/**
 * Converts a "dd/MM/yyyy" storage format to "DD MM" input format (trajet dates)
 */
export function storageDateToInputFormat(value: string): string {
  try {
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    if (!isValid(parsed)) return "";
    return format(parsed, "dd MM");
  } catch {
    return "";
  }
}

/**
 * Converts a "DD MM YYYY" birth date input to "dd/MM/yyyy" storage format
 */
export function birthDateInputToStorageFormat(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  const date = parseDateInput(value);
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
}

/**
 * Converts a "dd/MM/yyyy" storage format to "DD MM YYYY" input format (birth dates)
 */
export function storageBirthDateToInputFormat(value: string): string {
  try {
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    if (!isValid(parsed)) return "";
    return format(parsed, "dd MM yyyy");
  } catch {
    return "";
  }
}

/**
 * Checks if a trajet date input is complete (4 digits: DD MM)
 */
export function isDateInputComplete(value: string): boolean {
  return value.replace(/\D/g, "").length === 4;
}

/**
 * Checks if a birth date input is complete (8 digits: DD MM YYYY)
 */
export function isBirthDateInputComplete(value: string): boolean {
  return value.replace(/\D/g, "").length === 8;
}

/**
 * Checks if a time input has all 4 digits (complete time)
 */
export function isTimeInputComplete(value: string): boolean {
  return value.replace(/\D/g, "").length === 4;
}
