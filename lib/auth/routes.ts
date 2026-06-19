export const PUBLIC_PATHS = ['/caretaker_login', '/register', '/welcome'] as const

export function isPublicPath(pathname: string) {
  return (PUBLIC_PATHS as readonly string[]).includes(pathname)
}
