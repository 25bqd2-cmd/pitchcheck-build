import React from "react";
import type { PitchSetup, PracticeFocus } from "../types.ts";

interface SetupPanelProps {
  setup: PitchSetup;
  onChange: (next: PitchSetup) => void;
  onTryExample: () => void;
  onStart: () => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const FOCUS_OPTIONS: PracticeFocus[] = [
  "Balanced",
  "Business drivers",
  "Valuation",
  "Risks",
];

export function SetupPanel({
  setup,
  onChange,
  onTryExample,
  onStart,
  isLoading,
  error,
  onRetry,
}: SetupPanelProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isLoading) {
      e.preventDefault();
      onStart();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onStart();
    }
  };

  return (
    <section
      aria-labelledby="setup-heading"
      className="bg-white border border-[#E2DCD0] rounded-xl p-6 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-[#ECE7DC]">
        <div className="max-w-xl">
          <h2
            id="setup-heading"
            className="font-serif text-2xl font-medium tracking-tight text-[#1C1917]"
          >
            Prepare your practice session
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#57534E]">
            Enter as much or as little as you have ready. Missing details are
            collected one at a time in conversation. Inputs are sent to the selected AI service
            to generate feedback; this app does not persist session notes.
          </p>
        </div>

        <button
          type="button"
          onClick={onTryExample}
          disabled={isLoading}
          className="self-start shrink-0 whitespace-nowrap min-h-[40px] px-4 py-2 text-sm font-medium text-[#143B2B] bg-[#F4F1EA] border border-[#D4CDC0] rounded-lg hover:bg-[#EAE5DA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143B2B]"
        >
          Try a fictional example
        </button>
      </div>

      {setup.isFictionalExample && (
        <div
          role="status"
          className="mt-5 px-4 py-3 rounded-lg bg-[#F7F4EC] border border-[#DDD5C5] text-sm text-[#292524]"
        >
          <span className="font-semibold text-[#143B2B]">
            Fictional example loaded:
          </span>{" "}
          Northstar Tools is a fictional teaching case for rehearsal only, not a
          real company or investment recommendation.
        </div>
      )}

      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="pitch-company"
            className="block text-sm font-medium text-[#1C1917]"
          >
            Company or case
          </label>
          <input
            id="pitch-company"
            type="text"
            value={setup.company}
            disabled={isLoading}
            onChange={(e) =>
              onChange({
                ...setup,
                company: e.target.value,
                isFictionalExample:
                  setup.isFictionalExample &&
                  e.target.value.trim() === "Northstar Tools",
              })
            }
            placeholder="e.g. Costco Wholesale, or leave blank to decide in chat"
            className="mt-1.5 w-full min-h-[44px] px-3.5 py-2.5 text-[15px] text-[#1C1917] bg-[#FBF9F5] border border-[#D6CFC2] rounded-lg placeholder:text-[#8C857B] focus:bg-white focus:border-[#143B2B] focus:outline-none focus:ring-2 focus:ring-[#143B2B]/15 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="pitch-thesis"
            className="block text-sm font-medium text-[#1C1917]"
          >
            Short thesis
          </label>
          <textarea
            id="pitch-thesis"
            rows={2}
            value={setup.thesis}
            disabled={isLoading}
            onChange={(e) =>
              onChange({
                ...setup,
                thesis: e.target.value,
              })
            }
            placeholder="State your core argument in one or two sentences"
            className="mt-1.5 w-full px-3.5 py-2.5 text-[15px] leading-relaxed text-[#1C1917] bg-[#FBF9F5] border border-[#D6CFC2] rounded-lg placeholder:text-[#8C857B] focus:bg-white focus:border-[#143B2B] focus:outline-none focus:ring-2 focus:ring-[#143B2B]/15 disabled:opacity-60"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="pitch-notes"
              className="block text-sm font-medium text-[#1C1917]"
            >
              Supporting notes
            </label>
            <label
              htmlFor="pitch-no-evidence"
              className="inline-flex items-center gap-2 text-sm text-[#44403C] cursor-pointer select-none py-1"
            >
              <input
                id="pitch-no-evidence"
                type="checkbox"
                checked={setup.noEvidenceYet}
                disabled={isLoading}
                onChange={(e) =>
                  onChange({
                    ...setup,
                    noEvidenceYet: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-[#B8B0A2] text-[#143B2B] focus:ring-[#143B2B]"
              />
              <span>I have no evidence yet</span>
            </label>
          </div>
          <textarea
            id="pitch-notes"
            rows={4}
            value={setup.noEvidenceYet ? "" : setup.notes}
            disabled={isLoading || setup.noEvidenceYet}
            onChange={(e) =>
              onChange({
                ...setup,
                notes: e.target.value,
              })
            }
            placeholder={
              setup.noEvidenceYet
                ? "Marked as no evidence yet — the coach will help identify research gaps."
                : "Key numbers, unit economics, segment data, or observations from filings"
            }
            className="mt-1.5 w-full px-3.5 py-2.5 text-[15px] leading-relaxed text-[#1C1917] bg-[#FBF9F5] border border-[#D6CFC2] rounded-lg placeholder:text-[#8C857B] focus:bg-white focus:border-[#143B2B] focus:outline-none focus:ring-2 focus:ring-[#143B2B]/15 disabled:bg-[#F3EFE6] disabled:text-[#78716C] disabled:cursor-not-allowed"
          />
        </div>

        <fieldset disabled={isLoading}>
          <legend className="block text-sm font-medium text-[#1C1917]">
            Practice focus <span className="font-normal text-[#78716C]">(optional)</span>
          </legend>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FOCUS_OPTIONS.map((option) => {
              const selected = setup.focus === option;
              return (
                <label
                  key={option}
                  className={`flex items-center justify-center min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg border cursor-pointer transition-colors whitespace-nowrap select-none ${
                    selected
                      ? "bg-[#143B2B] text-[#FAF8F3] border-[#143B2B]"
                      : "bg-[#FBF9F5] text-[#292524] border-[#D6CFC2] hover:bg-[#F3EFE6]"
                  }`}
                >
                  <input
                    type="radio"
                    name="practice-focus"
                    value={option}
                    checked={selected}
                    onChange={() => onChange({ ...setup, focus: option })}
                    className="sr-only"
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="pitch-first-focus"
            className="block text-sm font-medium text-[#1C1917]"
          >
            First-question focus{" "}
            <span className="font-normal text-[#78716C]">(optional)</span>
          </label>
          <input
            id="pitch-first-focus"
            type="text"
            value={setup.firstQuestionFocus}
            disabled={isLoading}
            onChange={(e) =>
              onChange({
                ...setup,
                firstQuestionFocus: e.target.value,
              })
            }
            placeholder="Start by asking about the margin argument."
            className="mt-1.5 w-full min-h-[44px] px-3.5 py-2.5 text-[15px] text-[#1C1917] bg-[#FBF9F5] border border-[#D6CFC2] rounded-lg placeholder:text-[#8C857B] focus:bg-white focus:border-[#143B2B] focus:outline-none focus:ring-2 focus:ring-[#143B2B]/15 disabled:opacity-60"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 rounded-lg bg-[#FDF2F2] border border-[#E2B4B4] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <p className="text-sm text-[#7F1D1D]">
              <span className="font-semibold">Error:</span> {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="shrink-0 whitespace-nowrap min-h-[40px] px-4 py-2 text-sm font-medium text-[#7F1D1D] bg-white border border-[#D9A0A0] rounded-lg hover:bg-[#FAF0F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7F1D1D]"
            >
              Retry
            </button>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#ECE7DC]">
          <p className="text-xs leading-relaxed text-[#57534E]">
            Educational practice only. Supplied notes are not independently
            verified, and coach feedback can be wrong.
          </p>
          <button
            type="submit"
            disabled={isLoading}
            className="shrink-0 whitespace-nowrap min-h-[44px] px-6 py-2.5 text-sm font-medium text-[#FAF8F3] bg-[#143B2B] rounded-lg hover:bg-[#0F2E21] transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143B2B]"
          >
            {isLoading ? "Starting session…" : "Start practice"}
          </button>
        </div>
      </form>
    </section>
  );
}
