"use client";

import type { IntegrityReport } from "@/lib/pipeline/types";

type StepState = "pending" | "active" | "completed" | "error";

interface PipelineTrackerProps {
  status: string;
  currentStep: 1 | 2 | 3;
  activeView: 1 | 2 | 3;
  referencesCount: number;
  hasManuscript: boolean;
  integrityReport: IntegrityReport | null;
  onSelectStep: (step: 1 | 2 | 3) => void;
}

function getStepState(
  step: 1 | 2 | 3,
  props: Omit<PipelineTrackerProps, "onSelectStep">,
): StepState {
  if (props.status === "error" && props.currentStep === step) {
    return "error";
  }

  if ((props.status === "searching" || props.status === "translating") && step === 1) {
    return "active";
  }
  if (props.status === "drafting" && step === 2) {
    return "active";
  }
  if (props.status === "auditing" && step === 3) {
    return "active";
  }

  if (step === 1 && props.referencesCount > 0) {
    return "completed";
  }
  if (step === 2 && props.hasManuscript) {
    return "completed";
  }
  if (step === 3 && Boolean(props.integrityReport)) {
    return "completed";
  }

  return "pending";
}

const STEP_COPY = [
  {
    step: 1 as const,
    title: "Find evidence",
    subtitle: "Search PubMed/OpenAlex and review the shortlist.",
    accent: "bg-sky-500",
  },
  {
    step: 2 as const,
    title: "Build first draft",
    subtitle: "Turn selected papers into a manuscript scaffold.",
    accent: "bg-violet-500",
  },
  {
    step: 3 as const,
    title: "Audit claims",
    subtitle: "Flag overclaims, missing citations, and weak support.",
    accent: "bg-rose-500",
  },
];

export function PipelineTracker(props: PipelineTrackerProps) {
  return (
    <div className="rounded-[28px] border border-black/8 bg-white/85 p-4 shadow-[0_18px_40px_rgba(17,17,16,0.05)] backdrop-blur">
      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
            Workflow
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-stone-900">
            3 steps from evidence to audit
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            You can jump back to earlier steps at any time. Later steps unlock once the previous
            material exists.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {STEP_COPY.map((stepConfig) => {
          const stepState = getStepState(stepConfig.step, props);
          const selectable =
            stepConfig.step === 1 ||
            (stepConfig.step === 2 && props.referencesCount > 0) ||
            (stepConfig.step === 3 && props.hasManuscript);

          const helperText =
            stepConfig.step === 1
              ? props.referencesCount > 0
                ? `${props.referencesCount} study${props.referencesCount === 1 ? "" : "ies"} ready`
                : "Start by entering a research question"
              : stepConfig.step === 2
                ? props.hasManuscript
                  ? "Draft ready to review"
                  : props.referencesCount > 0
                    ? "Ready to generate draft"
                    : "Unlocks after you keep at least 1 study"
                : props.integrityReport
                  ? "Audit report ready"
                  : props.hasManuscript
                    ? "Ready to audit the draft"
                    : "Unlocks after a draft exists";

          return (
            <button
              key={stepConfig.step}
              type="button"
              onClick={() => selectable && props.onSelectStep(stepConfig.step)}
              disabled={!selectable}
              className={`flex h-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                props.activeView === stepConfig.step
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-black/8 bg-stone-50 text-stone-700"
              } ${!selectable ? "cursor-not-allowed opacity-60" : "hover:border-stone-400"}`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  stepState === "completed"
                    ? "bg-emerald-500 text-white"
                    : stepState === "active"
                      ? `${stepConfig.accent} text-white`
                      : stepState === "error"
                        ? "bg-rose-500 text-white"
                        : "bg-white text-stone-500"
                }`}
              >
                {stepState === "completed" ? "✓" : stepState === "error" ? "!" : stepConfig.step}
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] opacity-60">Step {stepConfig.step}</p>
                <p className="text-sm font-semibold">{stepConfig.title}</p>
                <p className="mt-1 text-sm leading-relaxed opacity-75">{stepConfig.subtitle}</p>
                <p className="mt-2 text-xs font-medium opacity-65">{helperText}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
