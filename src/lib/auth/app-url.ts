import "server-only";

import { headers } from "next/headers";

import { getSafeRedirectPath } from "@/lib/auth/redirects";

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    return url.origin.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function getConfiguredAppOrigin() {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(process.env.SITE_URL) ??
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeOrigin(process.env.VERCEL_URL)
  );
}

export async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = normalizeOrigin(headerStore.get("origin"));

  if (origin && (process.env.NODE_ENV !== "production" || !isLocalOrigin(origin))) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const hostOrigin = normalizeOrigin(host ? `${protocol}://${host}` : null);

  if (hostOrigin && (process.env.NODE_ENV !== "production" || !isLocalOrigin(hostOrigin))) {
    return hostOrigin;
  }

  return null;
}

export async function getServerAppOrigin() {
  const configuredOrigin = getConfiguredAppOrigin();

  if (configuredOrigin) return configuredOrigin;

  const requestOrigin = await getRequestOrigin();

  if (requestOrigin) return requestOrigin;

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error("Configure NEXT_PUBLIC_APP_URL for production auth redirects.");
}

export async function buildAppUrl(path: string) {
  const safePath = getSafeRedirectPath(path) ?? "/";
  return `${await getServerAppOrigin()}${safePath}`;
}
