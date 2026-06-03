const AUTH_PATHS = new Set(["/login", "/forgot-password", "/reset-password"]);

export function isAuthPath(pathname: string) {
  return AUTH_PATHS.has(pathname);
}

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.startsWith("/login") || value.startsWith("/forgot-password") || value.startsWith("/reset-password")) {
    return null;
  }

  return value;
}

export function buildLoginUrl(origin: string, nextPath?: string, error?: string) {
  const url = new URL("/login", origin);

  if (nextPath) {
    url.searchParams.set("next", nextPath);
  }

  if (error) {
    url.searchParams.set("error", error);
  }

  return url;
}
