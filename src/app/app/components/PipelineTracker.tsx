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

const OUTPUT_TABS = [
  { step: 1 as const, label: "Sources" },
  { step: 2 as const, label: "Draft" },
  { step: 3 as const, label: "Check" },
];

function getBadgeLabel(step: 1 | 2 | 3, props: Omit<PipelineTrackerProps, "onSelectStep">): string {
  if (step === 1) {
    return props.referencesCount > 0 ? String(props.referencesCount) : "0";
  }
  if (step === 2) {
    return props.hasManuscript ? "Ready" : "Locked";
  }

  return props.integrityReport ? `${props.integrityReport.overallScore}` : "Locked";
}

export function PipelineTracker(props: PipelineTrackerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-black/8 bg-white/88 p-2 shadow-[0_14px_30px_rgba(17,17,16,0.05)] backdrop-blur">
      {OUTPUT_TABS.map((tab) => {
        const stepState = getStepState(tab.step, props);
        const selectable =
          tab.step === 1 ||
          (tab.step === 2 && props.referencesCount > 0) ||
          (tab.step === 3 && props.hasManuscript);

        return (
          <button
            key={tab.step}
            type="button"
            onClick={() => selectable && props.onSelectStep(tab.step)}
            disabled={!selectable}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              props.activeView === tab.step
                ? "bg-stone-900 text-white"
                : "bg-stone-50 text-stone-600 hover:bg-white"
            } ${!selectable ? "cursor-not-allowed opacity-55" : ""}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                stepState === "completed"
                  ? "bg-emerald-400"
                  : stepState === "active"
                    ? "bg-sky-400"
                    : stepState === "error"
                      ? "bg-rose-400"
                      : "bg-stone-300"
              }`}
            />
            <span className="font-medium">{tab.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                props.activeView === tab.step ? "bg-white/12 text-white" : "bg-white text-stone-500"
              }`}
            >
              {getBadgeLabel(tab.step, props)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
