/**
 * ISBN-10 and ISBN-13 Validation and Formatting Utility
 */

export function normalizeIsbn(isbn: string): string {
  if (!isbn) return "";
  return isbn.replace(/[-\s]/g, "").toUpperCase();
}

/**
 * Validates ISBN-10 checksum using Modulo 11
 * Formula: sum(digit[i] * (10 - i)) for i=0..9 % 11 === 0
 */
export function isValidIsbn10(isbn: string): boolean {
  const clean = normalizeIsbn(isbn);
  if (!/^[0-9]{9}[0-9X]$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i);
  }
  const lastChar = clean[9];
  sum += lastChar === "X" ? 10 : parseInt(lastChar, 10);

  return sum % 11 === 0;
}

/**
 * Validates ISBN-13 checksum using Modulo 10
 * Formula: sum(digit[i] * (i % 2 === 0 ? 1 : 3)) for i=0..12 % 10 === 0
 */
export function isValidIsbn13(isbn: string): boolean {
  const clean = normalizeIsbn(isbn);
  if (!/^(978|979)[0-9]{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const digit = parseInt(clean[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  return sum % 10 === 0;
}

export interface IsbnValidationResult {
  isValid: boolean;
  type?: "ISBN-10" | "ISBN-13";
  normalized?: string;
  formatted?: string;
  error?: string;
}

/**
 * Validates whether string is a valid ISBN-10 or ISBN-13.
 */
export function validateIsbn(rawIsbn: string): IsbnValidationResult {
  const clean = normalizeIsbn(rawIsbn);
  if (!clean) {
    return { isValid: false, error: "ISBN आवश्यक है (ISBN is required)" };
  }

  if (clean.length === 10) {
    if (!/^[0-9]{9}[0-9X]$/.test(clean)) {
      return {
        isValid: false,
        error: "ISBN-10 में प्रथम 9 अंक और अंतिम अंक 0-9 या X होना चाहिए",
      };
    }
    if (!isValidIsbn10(clean)) {
      return {
        isValid: false,
        error: "अमान्य ISBN-10 चेक-सम (Invalid ISBN-10 Check Digit)",
      };
    }
    return {
      isValid: true,
      type: "ISBN-10",
      normalized: clean,
      formatted: `${clean.slice(0, 1)}-${clean.slice(1, 4)}-${clean.slice(4, 9)}-${clean.slice(9)}`,
    };
  }

  if (clean.length === 13) {
    if (!clean.startsWith("978") && !clean.startsWith("979")) {
      return {
        isValid: false,
        error: "ISBN-13 '978' या '979' से प्रारंभ होना चाहिए",
      };
    }
    if (!/^[0-9]{13}$/.test(clean)) {
      return {
        isValid: false,
        error: "ISBN-13 में केवल संख्यात्मक अंक (0-9) होने चाहिए",
      };
    }
    if (!isValidIsbn13(clean)) {
      return {
        isValid: false,
        error: "अमान्य ISBN-13 चेक-सम (Invalid ISBN-13 Check Digit)",
      };
    }
    return {
      isValid: true,
      type: "ISBN-13",
      normalized: clean,
      formatted: `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5, 8)}-${clean.slice(8, 12)}-${clean.slice(12)}`,
    };
  }

  return {
    isValid: false,
    error: `ISBN में 10 या 13 अंक होने चाहिए (वर्तमान में ${clean.length} अंक हैं)`,
  };
}

/**
 * Generates a valid standard 13-digit ISBN for uncataloged local library books.
 * Prefix 978-81 (India book identifier) + 7 random digits + valid check digit.
 */
export function generateValidIsbn13(): string {
  // 978 + 81 (India) + 7 random digits
  const prefix = "97881";
  let middle = "";
  for (let i = 0; i < 7; i++) {
    middle += Math.floor(Math.random() * 10).toString();
  }
  const digits = (prefix + middle).split("").map((d) => parseInt(d, 10));

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += i % 2 === 0 ? digits[i] : digits[i] * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const full13 = `${prefix}${middle}${checkDigit}`;

  return `${full13.slice(0, 3)}-${full13.slice(3, 5)}-${full13.slice(5, 8)}-${full13.slice(8, 12)}-${full13.slice(12)}`;
}
