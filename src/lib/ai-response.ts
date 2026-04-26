// Shared helpers for talking to Claude / OpenAI with guardrails.
//
// Fixes two classes of bug found in the audit:
//   1. Greedy regex `/\{[\s\S]*\}/` grabbed trailing prose and either threw
//      on JSON.parse or produced objects of the wrong shape.
//   2. No timeout meant a hung model request kept the serverless function
//      warm for the full 300s default.

export const AI_TIMEOUT_MS = 25_000

/** AbortSignal that fires after `ms`. Pass as `{ signal }` to SDK calls. */
export function aiAbort(ms: number = AI_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(ms)
}

/** True if an error came from an aborted / timed-out request. */
export function isAbortError(e: unknown): boolean {
  if (!(e instanceof Error)) return false
  return e.name === 'AbortError' || e.name === 'TimeoutError'
}

/**
 * Extract the first balanced `{...}` object from a model response that may
 * include surrounding prose. Returns `null` on any failure so callers can
 * decide whether to fall back or return an error.
 *
 * Why not `match(/\{[\s\S]*\}/)`? That pattern is greedy — it spans from the
 * first `{` to the last `}` in the entire response. If the model emits
 * "Here's JSON: {a:1} — hope that helps!", the match includes the trailing
 * text and JSON.parse throws.
 */
export function extractJsonObject(content: string): unknown | null {
  const start = content.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  let end = -1

  for (let i = start; i < content.length; i++) {
    const c = content[i]
    if (escaped) { escaped = false; continue }
    if (c === '\\') { escaped = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '{') {
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  if (end === -1) return null

  try {
    return JSON.parse(content.slice(start, end + 1))
  } catch {
    return null
  }
}
