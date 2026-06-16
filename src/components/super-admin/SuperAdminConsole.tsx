"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CalendarClock, CheckCircle2, CircleDollarSign, Search, ShieldAlert, UsersRound } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { updateDemoRequestStatusAction, updateSchoolSubscriptionAction, type SuperAdminSchool, type getSuperAdminData } from "@/actions/super-admin/actions";
import { Button } from "@/components/ui/button";
import { subscriptionUpdateSchema, type SubscriptionUpdateInput } from "@/lib/platform-admin/schema";
import { cn } from "@/lib/utils";

type ConsoleData = Awaited<ReturnType<typeof getSuperAdminData>>;

export function SuperAdminConsole({ data }: { data: ConsoleData }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [expirySoon, setExpirySoon] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SuperAdminSchool | null>(null);
  const [now] = useState(() => Date.now());

  const schools = useMemo(() => {
    return data.schools.filter((school) => {
      const matchesQuery = school.name.toLowerCase().includes(query.toLowerCase()) || school.email?.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || school.status === status;
      const matchesPlan = plan === "all" || school.plan === plan;
      const expiresSoon = school.expiresAt ? new Date(school.expiresAt).getTime() - now <= 14 * 24 * 60 * 60 * 1000 : false;
      return matchesQuery && matchesStatus && matchesPlan && (!expirySoon || expiresSoon);
    });
  }, [data.schools, expirySoon, now, plan, query, status]);

  return (
    <main className="min-h-dvh bg-[#071225] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-200">Gradix platform</p>
          <h1 className="mt-2 text-3xl font-extrabold">Super Admin</h1>
          <p className="mt-2 text-sm text-slate-300">Manage schools, demo requests, and manual subscriptions. School admins do not get access here.</p>
        </header>
        <OverviewCards overview={data.overview} />
        <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Schools</h2>
              <p className="text-sm text-slate-400">All tenant workspaces and manual billing controls.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm">
                <Search className="size-4 text-slate-500" />
                <input className="min-w-0 bg-transparent outline-none placeholder:text-slate-500" placeholder="Search school" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <Select value={status} onChange={setStatus} options={["all", "trial", "active", "expired", "suspended"]} />
              <Select value={plan} onChange={setPlan} options={["all", "starter", "standard", "premium"]} />
              <Button className={cn("border-white/10", expirySoon ? "bg-orange-500 text-slate-950" : "bg-white/5 text-slate-200")} type="button" variant="outline" onClick={() => setExpirySoon((value) => !value)}>
                Expiry soon
              </Button>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>{["School", "Owner", "Email", "Phone", "Plan", "Status", "Expiry", "Students", "Created", "Actions"].map((heading) => <th className="px-4 py-3" key={heading}>{heading}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {schools.map((school) => (
                  <tr className="align-top" key={school.id}>
                    <td className="px-4 py-4 font-semibold text-white">{school.name}</td>
                    <td className="px-4 py-4">{school.ownerName}</td>
                    <td className="px-4 py-4">{school.email ?? "No email"}</td>
                    <td className="px-4 py-4">{school.phone ?? "No phone"}</td>
                    <td className="px-4 py-4 capitalize">{school.plan}</td>
                    <td className="px-4 py-4"><StatusBadge status={school.status} /></td>
                    <td className="px-4 py-4">{formatDate(school.expiresAt)}</td>
                    <td className="px-4 py-4">{school.studentCount}{school.studentLimit ? ` / ${school.studentLimit}` : ""}</td>
                    <td className="px-4 py-4">{formatDate(school.createdAt)}</td>
                    <td className="px-4 py-4">
                      <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" size="sm" type="button" variant="outline" onClick={() => setEditingSchool(school)}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {schools.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">No schools match these filters.</p> : null}
          </div>
        </section>
        <DemoRequestsTable requests={data.demoRequests} />
      </div>
      {editingSchool ? <SubscriptionModal school={editingSchool} onClose={() => setEditingSchool(null)} /> : null}
    </main>
  );
}

function OverviewCards({ overview }: { overview: ConsoleData["overview"] }) {
  const cards = [
    { label: "Total Schools", value: overview.totalSchools, icon: Building2 },
    { label: "Active Schools", value: overview.activeSchools, icon: CheckCircle2 },
    { label: "Trial Schools", value: overview.trialSchools, icon: CalendarClock },
    { label: "Expired Schools", value: overview.expiredSchools, icon: ShieldAlert },
    { label: "Suspended Schools", value: overview.suspendedSchools, icon: ShieldAlert },
    { label: "Total Students", value: overview.totalStudents, icon: UsersRound },
    { label: "Demo Requests", value: overview.demoRequests, icon: Search },
    { label: "Est. Active Term Revenue", value: `₦${overview.estimatedRevenue.toLocaleString()}`, icon: CircleDollarSign },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-4" key={label}>
          <Icon className="size-5 text-orange-200" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-white">{value}</p>
        </article>
      ))}
    </section>
  );
}

function DemoRequestsTable({ requests }: { requests: ConsoleData["demoRequests"] }) {
  const [pending, startTransition] = useTransition();

  function updateStatus(requestId: string, status: "contacted" | "demo_booked" | "converted" | "not_interested") {
    startTransition(async () => {
      const result = await updateDemoRequestStatusAction({ requestId, status });
      if (!result.ok) alert(result.message);
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <h2 className="text-xl font-bold">Demo Requests</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr>{["Name", "School", "Role", "Phone", "Email", "Students", "Status", "Created", "Actions"].map((heading) => <th className="px-4 py-3" key={heading}>{heading}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-4 font-semibold text-white">{request.full_name}</td>
                <td className="px-4 py-4">{request.school_name}</td>
                <td className="px-4 py-4">{request.role ?? "Not set"}</td>
                <td className="px-4 py-4">{request.phone}</td>
                <td className="px-4 py-4">{request.email ?? "No email"}</td>
                <td className="px-4 py-4">{request.student_count ?? "Not set"}</td>
                <td className="px-4 py-4 capitalize">{request.status.replace(/_/g, " ")}</td>
                <td className="px-4 py-4">{formatDate(request.created_at)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {(["contacted", "demo_booked", "converted", "not_interested"] as const).map((status) => (
                      <Button className="border-white/10 bg-white/5 text-slate-100" disabled={pending} key={status} size="sm" type="button" variant="outline" onClick={() => updateStatus(request.id, status)}>
                        {status.replace(/_/g, " ")}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">No demo requests yet.</p> : null}
      </div>
    </section>
  );
}

function SubscriptionModal({ school, onClose }: { school: SuperAdminSchool; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<SubscriptionUpdateInput>({
    resolver: zodResolver(subscriptionUpdateSchema),
    defaultValues: {
      schoolId: school.id,
      subscriptionStatus: school.status,
      subscriptionPlan: school.plan,
      subscriptionExpiresAt: school.expiresAt?.slice(0, 10) ?? "",
      studentLimit: school.studentLimit ?? 300,
      billingNote: school.billingNote,
    },
  });
  const selectedStatus = form.watch("subscriptionStatus");

  function submit(values: SubscriptionUpdateInput) {
    if (values.subscriptionStatus === "suspended" && !window.confirm("Suspend this school? Dashboard mutations will be restricted.")) return;

    startTransition(async () => {
      const result = await updateSchoolSubscriptionAction(values);
      alert(result.message);
      if (result.ok) onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <form className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#071225] p-5 text-slate-100 shadow-2xl" onSubmit={form.handleSubmit(submit)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-orange-200">Subscription</p>
            <h2 className="mt-1 text-2xl font-extrabold">{school.name}</h2>
          </div>
          <Button className="border-white/10 bg-white/5 text-slate-100" type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Status"><Select value={selectedStatus} onChange={(value) => form.setValue("subscriptionStatus", value as SubscriptionUpdateInput["subscriptionStatus"])} options={["trial", "active", "expired", "suspended"]} /></Field>
          <Field label="Plan"><Select value={form.watch("subscriptionPlan")} onChange={(value) => form.setValue("subscriptionPlan", value as SubscriptionUpdateInput["subscriptionPlan"])} options={["starter", "standard", "premium"]} /></Field>
          <Field label="Expiry date"><input className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 outline-none" type="date" {...form.register("subscriptionExpiresAt")} /></Field>
          <Field label="Student limit"><input className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 outline-none" type="number" {...form.register("studentLimit")} /></Field>
          <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
            Billing note
            <textarea className="min-h-24 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 outline-none" {...form.register("billingNote")} />
          </label>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button className="border-white/10 bg-white/5 text-slate-100" type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={pending} type="submit">
            {pending ? "Saving..." : "Update subscription"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}{children}</label>;
}

function Select({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <select className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}
    </select>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold capitalize", status === "active" ? "bg-emerald-400/10 text-emerald-200" : status === "trial" ? "bg-sky-400/10 text-sky-200" : status === "expired" ? "bg-amber-400/10 text-amber-200" : "bg-red-400/10 text-red-200")}>{status}</span>;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}
