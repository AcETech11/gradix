export function logAuthDebug(event: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[gradix-auth] ${event}`, details ?? {});
  }
}

export function logAuthError(event: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[gradix-auth] ${event}`, error);
  }
}
