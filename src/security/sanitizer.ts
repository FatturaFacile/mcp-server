/**
 * Input/output sanitization and secret scrubbing utility.
 */

const SECRET_PATTERNS = [
  /password["':\s]+["']?([^"',\s]+)/gi,
  /bearer\s+([a-zA-Z0-9_\-\.]+)/gi,
  /api[_-]?key["':\s]+["']?([^"',\s]+)/gi,
  /token["':\s]+["']?([^"',\s]+)/gi,
  /secret["':\s]+["']?([^"',\s]+)/gi,
];

export class DataSanitizer {
  public static scrubSecrets(text: string): string {
    let sanitized = text;
    for (const pattern of SECRET_PATTERNS) {
      sanitized = sanitized.replace(pattern, (match, val) => {
        return match.replace(val, '******');
      });
    }
    return sanitized;
  }

  public static sanitizeObject<T>(obj: T): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item)) as unknown as T;
    }

    const copy = { ...obj } as Record<string, unknown>;
    for (const [k, v] of Object.entries(copy)) {
      const lower = k.toLowerCase();
      if (
        lower.includes('password') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('apikey')
      ) {
        copy[k] = '******';
      } else if (typeof v === 'object' && v !== null) {
        copy[k] = this.sanitizeObject(v);
      }
    }
    return copy as T;
  }
}
