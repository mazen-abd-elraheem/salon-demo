/**
 * Guzel Medical Spa — Security Utilities
 * Defends against CSV Formula Injection, unsafe URL schemes (javascript:),
 * and provides deterministic hashing for local customer demo credentials.
 */

const FORMULA_TRIGGER_RE = /^[=+\-@\t\r]/;

/**
 * Safely encodes a value for RFC-4180 CSV export while neutralizing
 * Excel/LibreOffice CSV Formula Injection payloads (=, +, -, @, tab, CR).
 */
export function sanitizeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const safe = FORMULA_TRIGGER_RE.test(raw) ? `'${raw}` : raw;
  const escaped = safe.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Triggers a safe UTF-8 BOM CSV file download using Blob URLs (no data: URI limits).
 */
export function downloadSafeCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const lines = [
    headers.map(sanitizeCsvCell).join(','),
    ...rows.map((row) => row.map(sanitizeCsvCell).join(',')),
  ];
  const csvBlob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(csvBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Validates that an external or uploaded URL uses a safe scheme (https:, http:, or data:image/).
 * Blocks javascript:, vbscript:, and data:text/html payloads.
 */
export function sanitizeSafeUrl(url: string | null | undefined, fallback = ''): string {
  if (!url) return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    if (parsed.protocol === 'data:' && /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(trimmed)) {
      return trimmed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Lightweight salted hash for local demo customer credential verification
 * (avoids storing cleartext customer passwords in localStorage).
 */
export function hashLocalPassword(salt: string, password: string): string {
  const input = `guzel_pw_v2:${salt.trim().toLowerCase()}:${password}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}
