"use client";

import { useState, useTransition } from "react";

import type { AuthActionState } from "@/types/auth";

export function useAuthResult<TData = unknown>() {
  const [result, setResult] = useState<AuthActionState<TData> | null>(null);
  const [isPending, startTransition] = useTransition();

  return {
    result,
    setResult,
    isPending,
    startTransition,
  };
}
