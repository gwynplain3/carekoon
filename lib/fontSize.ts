export const FONT_SIZE_MIN = 16
export const FONT_SIZE_MAX = 32
export const FONT_SIZE_STEP = 2
export const FONT_SIZE_DEFAULT = 20

function cacheKey(userId?: string) {
  return userId ? `font_size_${userId}` : 'font_size'
}

export function applyFontSize(px: number, userId?: string) {
  const clamped = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, px))
  document.documentElement.style.setProperty('--base-font-size', `${clamped}px`)
  if (userId) localStorage.setItem(cacheKey(userId), String(clamped))
  return clamped
}

export function getCachedFontSize(userId?: string): number | null {
  if (!userId) return null
  const cached = localStorage.getItem(cacheKey(userId))
  return cached ? Number(cached) : null
}

export function resolveFontSize(profileSize?: number | null, userId?: string) {
  if (profileSize) return profileSize
  return getCachedFontSize(userId) ?? FONT_SIZE_DEFAULT
}
