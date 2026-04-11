// --- Cron / internal secret verification (edge-compatible) ---

export function verifyCronSecret(headerValue: string | null): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('CRON_SECRET is not configured')
    return false
  }
  if (!headerValue) return false
  if (headerValue.length !== secret.length) return false
  // Constant-time comparison without Node.js crypto
  const encoder = new TextEncoder()
  const a = encoder.encode(headerValue)
  const b = encoder.encode(secret)
  if (a.byteLength !== b.byteLength) return false
  let mismatch = 0
  for (let i = 0; i < a.byteLength; i++) {
    mismatch |= a[i] ^ b[i]
  }
  return mismatch === 0
}

// --- Rate limiting (in-memory, per-instance with lazy cleanup) ---
// Works with Fluid Compute's instance reuse. Not shared across instances;
// provides per-instance abuse protection, not a global distributed limit.

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
let lastCleanup = Date.now()

function lazyCleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) rateLimitStore.delete(key)
  }
}

export function rateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
): { allowed: boolean; remaining: number } {
  lazyCleanup()
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  entry.count++
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 }
  }
  return { allowed: true, remaining: maxRequests - entry.count }
}

// --- File upload validation ---

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
])

const ALLOWED_DOCUMENT_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
])

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg',
  'audio/flac', 'audio/x-m4a', 'audio/mp3',
])

const ALLOWED_EXTENSIONS: Record<string, Set<string>> = {
  image: new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']),
  document: new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf']),
  audio: new Set(['mp3', 'mp4', 'wav', 'webm', 'ogg', 'flac', 'm4a']),
}

const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,     // 10 MB
  document: 20 * 1024 * 1024,  // 20 MB
  audio: 25 * 1024 * 1024,     // 25 MB (Whisper API limit)
}

export function validateFile(
  file: File,
  category: 'image' | 'document' | 'audio',
): { valid: boolean; error?: string; sanitizedExt: string } {
  const maxSize = MAX_FILE_SIZES[category]
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`, sanitizedExt: '' }
  }

  const allowedMime = category === 'audio'
    ? ALLOWED_AUDIO_TYPES
    : category === 'document'
      ? ALLOWED_DOCUMENT_TYPES
      : ALLOWED_IMAGE_TYPES

  if (!allowedMime.has(file.type)) {
    return { valid: false, error: `File type '${file.type}' is not allowed`, sanitizedExt: '' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const allowedExt = ALLOWED_EXTENSIONS[category]
  if (!allowedExt.has(ext)) {
    return { valid: false, error: `File extension '.${ext}' is not allowed`, sanitizedExt: '' }
  }

  return { valid: true, sanitizedExt: ext }
}

// --- HTML escaping ---

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// --- Email validation ---

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email)
}

// --- Input length validation ---

export function truncate(str: unknown, maxLen: number): string {
  if (typeof str !== 'string') return ''
  return str.slice(0, maxLen)
}

// --- App URL (single source of truth) ---

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://gutted.app'
}

export function isAllowedOrigin(origin: string): boolean {
  const appUrl = getAppUrl()
  const allowed = new Set([appUrl, 'https://gutted.app'])
  return allowed.has(origin)
}
