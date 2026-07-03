import "server-only";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export type PublicSchoolPortal = {
  slug: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  motto: string | null;
  primaryColor: string;
  secondaryColor: string;
};

type PublicSchoolPortalResponse =
  | {
      ok: true;
      school: PublicSchoolPortal;
    }
  | null;

export async function getPublicSchoolPortal(slug: string) {
  const normalizedSlug = normalizeSchoolSlug(slug);

  if (!normalizedSlug) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_school_portal", {
    input_slug: normalizedSlug,
  });

  if (error || !data || typeof data !== "object") return null;

  const result = data as PublicSchoolPortalResponse;

  return result?.ok ? result.school : null;
}

export async function getSchoolSlugFromHostname() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";

  return resolveSchoolSlugFromHost(host);
}

export function resolveSchoolSlugFromHost(host: string) {
  const rootDomain = (process.env.ROOT_DOMAIN ?? "gradix.ng").toLowerCase();
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  if (!hostname || hostname === rootDomain || hostname === `www.${rootDomain}`) return null;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".vercel.app")) return null;
  if (!hostname.endsWith(`.${rootDomain}`)) return null;

  const candidate = hostname.slice(0, -rootDomain.length - 1);

  if (!candidate || candidate.includes(".")) return null;

  return normalizeSchoolSlug(candidate);
}

export function normalizeSchoolSlug(value: string) {
  const slug = value.trim().toLowerCase();

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}
