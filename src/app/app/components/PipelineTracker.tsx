"use client";

import { Fragment } from "react";
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
  { step: 1 as const, label: "Papers", number: "1" },
  { step: 2 as const, label: "Draft", number: "2" },
  { step: 3 as const, label: "Review", number: "3" },
];

function getBadgeLabel(step: 1 | 2 | 3, props: Omit<PipelineTrackerProps, "onSelectStep">): string {
  if (step === 1) {
    if (props.status === "searching" || props.status === "translating") {
      return "Searching...";
    }

    return props.referencesCount > 0 ? `${props.referencesCount} papers` : "";
  }
  if (step === 2) {
    if (props.status === "drafting") {
      return "Writing...";
    }

    return props.hasManuscript ? "Ready" : "";
  }

  if (props.status === "auditing") {
    return "Checking...";
  }

  return props.integrityReport ? `${props.integrityReport.overallScore}/100` : "";
}

export function PipelineTracker(props: PipelineTrackerProps) {
  return (
    <div className="flex w-full items-start gap-0">
      {OUTPUT_TABS.map((tab, index) => {
        const stepState = getStepState(tab.step, props);
        const selectable =
          tab.step === 1 ||
          (tab.step === 2 && props.referencesCount > 0) ||
          (tab.step === 3 && props.hasManuscript);
        const badge = getBadgeLabel(tab.step, props);
        const nextStep = OUTPUT_TABS[index + 1];
        const nextCompleted = nextStep
          ? getStepState(nextStep.step, props) === "completed"
          : false;

        return (
          <Fragment key={tab.step}>
            <button
              type="button"
              onClick={() => selectable && props.onSelectStep(tab.step)}
              disabled={!selectable}
              className={`flex min-w-[72px] flex-col items-center gap-1 text-center transition ${
                !selectable ? "cursor-not-allowed opacity-45" : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  stepState === "completed"
                    ? "bg-emerald-500 text-white"
                    : stepState === "active"
                      ? "animate-pulse bg-[#C4634E] text-white"
                      : stepState === "error"
                        ? "bg-rose-500 text-white"
                        : "bg-stone-200 text-stone-500"
                } ${props.activeView === tab.step ? "ring-2 ring-black/8 ring-offset-2 ring-offset-white" : ""}`}
              >
                {stepState === "completed" ? "✓" : tab.number}
              </div>
              <span
                className={`text-xs font-medium ${
                  props.activeView === tab.step ? "text-stone-900" : "text-stone-600"
                }`}
              >
                {tab.label}
              </span>
              <span className="min-h-[14px] text-[10px] text-stone-400">{badge}</span>
            </button>

            {index < OUTPUT_TABS.length - 1 ? (
              <div
                className={`mx-1 mt-4 h-0.5 flex-1 ${
                  nextCompleted ? "bg-emerald-400" : "bg-stone-200"
                }`}
              />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
