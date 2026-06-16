import Link from "next/link";

import { getStaffInvitationAction } from "@/actions/settings/staff-invitation-actions";
import { AcceptInviteButton } from "./AcceptInviteButton";

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getStaffInvitationAction(token);

  return (
    <main className="min-h-dvh bg-[#071225] px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-200">Gradix staff invitation</p>
        {invitation.ok ? (
          <>
            <h1 className="mt-4 text-3xl font-extrabold">Join {invitation.school_name}</h1>
            <dl className="mt-6 grid gap-3 text-sm">
              <Row label="Name" value={invitation.full_name ?? "Invited staff"} />
              <Row label="Email" value={invitation.email ?? ""} />
              <Row label="Role" value={invitation.role ?? ""} />
            </dl>
            <p className="mt-6 text-sm leading-6 text-slate-300">
              Sign in with the invited email address first, then accept this invitation. If you do not have an account yet, create one with this same email and return to this link after verification.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <AcceptInviteButton token={token} />
              <Link className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-4 font-semibold text-slate-100" href={`/login?redirectTo=/accept-invite/${token}`}>
                Sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-3xl font-extrabold">Invitation unavailable</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">{invitation.message ?? "This invitation could not be found."}</p>
            <Link className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-orange-600 px-4 font-semibold text-white" href="/login">
              Go to login
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-4 py-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-semibold capitalize text-slate-50">{value}</dd>
    </div>
  );
}
