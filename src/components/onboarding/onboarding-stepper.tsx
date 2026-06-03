"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
};

type OnboardingStepperProps = {
  steps: OnboardingStep[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepChange: (step: number) => void;
};

export function OnboardingStepper({ steps, currentStep, completedSteps, onStepChange }: OnboardingStepperProps) {
  return (
    <nav className="grid gap-2 sm:grid-cols-5" aria-label="Onboarding progress">
      {steps.map((step, index) => {
        const isActive = currentStep === index;
        const isComplete = completedSteps.has(index);

        return (
          <button
            type="button"
            className={cn(
              "rounded-2xl border p-3 text-left transition-all duration-200",
              isActive
                ? "border-orange-400 bg-orange-50 text-slate-950 shadow-lg shadow-orange-950/10"
                : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50/50",
            )}
            onClick={() => onStepChange(index)}
            key={step.id}
          >
            <span
              className={cn(
                "mb-3 flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                isComplete ? "bg-orange-600 text-white" : isActive ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500",
              )}
            >
              {isComplete ? <Check className="size-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className="block text-sm font-semibold">{step.title}</span>
            <span className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">{step.description}</span>
          </button>
        );
      })}
    </nav>
  );
}
