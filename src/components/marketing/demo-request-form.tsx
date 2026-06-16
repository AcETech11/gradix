"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { requestDemoAction } from "@/actions/demo/request-demo-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoRequestSchema, type DemoRequestInput } from "@/lib/demo/demo-request-schema";

const roleOptions = ["Proprietor/Owner", "Headmaster/Headmistress", "Principal", "Administrator", "ICT Staff", "Teacher", "Other"];
const studentOptions = ["Under 100", "100-300", "301-700", "701-1500", "1500+"];
const planOptions = ["Starter", "Standard", "Premium", "Not sure yet"];

export function DemoRequestForm() {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      fullName: "",
      schoolName: "",
      role: "",
      phone: "",
      email: "",
      studentCountRange: "",
      preferredPlan: "Not sure yet",
      message: "",
    },
  });

  function submit(values: DemoRequestInput) {
    setMessage(null);
    startTransition(async () => {
      const result = await requestDemoAction(values);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) form.reset();
    });
  }

  return (
    <form className="rounded-[1.75rem] border border-[#E2E8F0] bg-white p-5 shadow-2xl shadow-slate-950/10 sm:p-6" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={form.formState.errors.fullName?.message}>
            <Input className="rounded-xl" {...form.register("fullName")} />
          </Field>
          <Field label="School name" error={form.formState.errors.schoolName?.message}>
            <Input className="rounded-xl" {...form.register("schoolName")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" error={form.formState.errors.role?.message}>
            <Select {...form.register("role")}>
              <option value="">Choose role</option>
              {roleOptions.map((option) => <option key={option}>{option}</option>)}
            </Select>
          </Field>
          <Field label="Phone / WhatsApp" error={form.formState.errors.phone?.message}>
            <Input className="rounded-xl" {...form.register("phone")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input className="rounded-xl" type="email" {...form.register("email")} />
          </Field>
          <Field label="Number of students" error={form.formState.errors.studentCountRange?.message}>
            <Select {...form.register("studentCountRange")}>
              <option value="">Choose range</option>
              {studentOptions.map((option) => <option key={option}>{option}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Preferred plan" error={form.formState.errors.preferredPlan?.message}>
          <Select {...form.register("preferredPlan")}>
            {planOptions.map((option) => <option key={option}>{option}</option>)}
          </Select>
        </Field>
        <Field label="Message" error={form.formState.errors.message?.message}>
          <textarea className="min-h-28 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100" {...form.register("message")} />
        </Field>
        {message ? <p className={message.ok ? "rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700" : "rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"}>{message.text}</p> : null}
        <Button className="h-12 rounded-xl bg-[#F97316] text-white hover:bg-[#EA580C]" disabled={pending} type="submit">
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Submit demo request
        </Button>
      </div>
    </form>
  );
}

function Field({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#0F172A]">
      {label}
      {children}
      {error ? <span className="text-xs font-medium text-[#DC2626]">{error}</span> : null}
    </label>
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-100" {...props} />;
}
