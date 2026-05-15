const NON_DIGIT_REGEX = /\D/g;

function digitsOnly(value: string): string {
  return value.replace(NON_DIGIT_REGEX, '');
}

/**
 * Normalize Philippine mobile numbers to E.164 (+639XXXXXXXXX).
 * Accepts: 09XXXXXXXXX, 9XXXXXXXXX, +639XXXXXXXXX, 639XXXXXXXXX.
 */
export function normalizePhToE164(value: string): string | null {
  const digits = digitsOnly(value ?? '');

  if (digits.length === 11 && digits.startsWith('09')) {
    return `+63${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith('9')) {
    return `+63${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('63') && digits[2] === '9') {
    return `+${digits}`;
  }

  return null;
}

/**
 * Normalize Philippine mobile numbers to local format expected by some
 * payment providers: 9XXXXXXXXX (without +63).
 */
export function normalizePhToLocalMobile(value: string): string | null {
  const e164 = normalizePhToE164(value);
  if (!e164) {
    return null;
  }

  return e164.slice(3);
}
