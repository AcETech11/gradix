export function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "The email or password you entered is incorrect.";
  }

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "That email is already registered. Use a different one or sign in.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }

  if (normalized.includes("expired") || normalized.includes("invalid token")) {
    return "This session link has expired. Request a new one and try again.";
  }

  if (normalized.includes("fetch") || normalized.includes("network")) {
    return "We could not reach the authentication service. Check your connection and try again.";
  }

  return message || "Something went wrong. Try again.";
}

export function isBlockedProfile(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  const values = metadata as Record<string, unknown>;

  return values.blocked === true || values.status === "blocked";
}
