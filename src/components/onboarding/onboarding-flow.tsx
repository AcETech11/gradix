"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { AcademicStructureStep } from "@/components/onboarding/academic-structure-step";
import { BrandingStep } from "@/components/onboarding/branding-step";
import { CompletionStep } from "@/components/onboarding/completion-step";
import { OnboardingStepper, type OnboardingStep } from "@/components/onboarding/onboarding-stepper";
import { ProgressTracker } from "@/components/onboarding/progress-tracker";
import { SchoolInformationStep } from "@/components/onboarding/school-information-step";
import { StepCard } from "@/components/onboarding/step-card";
import { SubjectsAssignmentsStep } from "@/components/onboarding/subjects-assignments-step";
import type {
  AcademicStructureInput,
  BrandingInput,
  SchoolInformationInput,
  SubjectsAssignmentsInput,
} from "@/lib/onboarding/schema";
import type { OnboardingClass, OnboardingInitialData, OnboardingSubject } from "@/types/onboarding";

const steps: OnboardingStep[] = [
  {
    id: "school",
    title: "School",
    description: "Institution details",
  },
  {
    id: "branding",
    title: "Branding",
    description: "Logo and colors",
  },
  {
    id: "structure",
    title: "Structure",
    description: "Classes and teachers",
  },
  {
    id: "subjects",
    title: "Subjects",
    description: "Assignments",
  },
  {
    id: "complete",
    title: "Complete",
    description: "Review setup",
  },
];

type OnboardingFlowProps = {
  initialData: OnboardingInitialData;
  schoolInformation: SchoolInformationInput;
  branding: BrandingInput;
  academicStructure: AcademicStructureInput;
  subjectAssignments: SubjectsAssignmentsInput;
};

export function OnboardingFlow({
  initialData,
  schoolInformation,
  branding,
  academicStructure,
  subjectAssignments,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());
  const [classes, setClasses] = useState<OnboardingClass[]>(initialData.classes);
  const [subjects, setSubjects] = useState<OnboardingSubject[]>(initialData.subjects);

  useEffect(() => {
    function goNext() {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    }

    window.addEventListener("gradix:onboarding-next", goNext);

    return () => window.removeEventListener("gradix:onboarding-next", goNext);
  }, []);

  const completedSteps = useMemo(() => completed, [completed]);

  function markComplete(step: number) {
    setCompleted((current) => new Set(current).add(step));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/95 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur sm:p-5">
        <ProgressTracker currentStep={currentStep} totalSteps={steps.length} />
        <div className="mt-5">
          <OnboardingStepper steps={steps} currentStep={currentStep} completedSteps={completedSteps} onStepChange={setCurrentStep} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {currentStep === 0 ? (
            <StepCard
              eyebrow="Step 1"
              title="School Information"
              description="Set the institution profile that appears across the Gradix workspace and future reports."
            >
              <SchoolInformationStep defaultValues={schoolInformation} onComplete={() => markComplete(0)} />
            </StepCard>
          ) : null}

          {currentStep === 1 ? (
            <StepCard
              eyebrow="Step 2"
              title="Branding Setup"
              description="Upload official assets and choose brand colors for a polished school experience."
            >
              <BrandingStep defaultValues={branding} schoolId={initialData.school.id} onComplete={() => markComplete(1)} />
            </StepCard>
          ) : null}

          {currentStep === 2 ? (
            <StepCard
              eyebrow="Step 3"
              title="Academic Structure"
              description="Create classes, assign class teachers, and keep the structure easy to update."
            >
              <AcademicStructureStep
                defaultValues={academicStructure}
                teachers={initialData.teachers}
                onSaved={setClasses}
                onComplete={() => markComplete(2)}
              />
            </StepCard>
          ) : null}

          {currentStep === 3 ? (
            <StepCard
              eyebrow="Step 4"
              title="Subjects & Class Assignments"
              description="Create subjects and assign them to the right classes with searchable bulk controls."
            >
              <SubjectsAssignmentsStep
                defaultValues={subjectAssignments}
                classes={classes}
                onSaved={setSubjects}
                onComplete={() => markComplete(3)}
              />
            </StepCard>
          ) : null}

          {currentStep === 4 ? (
            <StepCard
              eyebrow="Step 5"
              title="Completion"
              description="Review your setup and continue to the Gradix dashboard."
            >
              <CompletionStep
                schoolName={schoolInformation.schoolName}
                schoolCode={schoolInformation.schoolCode}
                classes={classes}
                subjects={subjects}
              />
            </StepCard>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
