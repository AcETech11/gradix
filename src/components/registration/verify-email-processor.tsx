"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

type VerifyEmailProcessorProps = {
  code: string;
  email?: string;
};

export function VerifyEmailProcessor({ code, email }: VerifyEmailProcessorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const params = new URLSearchParams({ code });
        if (email) {
          params.set("email", email);
        }

        const response = await fetch(`/api/verify-email/complete?${params.toString()}`, {
          method: "GET",
          credentials: "include",
        });

        const payload = (await response.json()) as {
          ok: boolean;
          redirectTo?: string;
          message?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.ok || !payload.redirectTo) {
          setError(payload.message ?? "We could not verify your email. The link may have expired.");
          return;
        }

        router.replace(payload.redirectTo);
        router.refresh();
      } catch {
        if (!cancelled) {
          setError("We could not verify your email. Check your connection and try again.");
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [code, email, router]);

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
        <LoaderCircle className="size-8 animate-spin" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Verifying your email...</h2>
        <p className="mt-2 text-sm text-slate-600">We are creating your school tenant and admin account now.</p>
      </div>
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
