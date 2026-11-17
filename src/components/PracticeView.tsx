import React, { useEffect, useRef } from "react";
import type { ChatMessage } from "../types.ts";
import { MarkdownContent } from "./MarkdownContent.tsx";

interface PracticeViewProps {
  companyLabel: string;
  isFictionalExample: boolean;
  focusLabel: string;
  messages: ChatMessage[];
  questionsAsked: number;
  answersAttempted: number;
  isFinished: boolean;
  recapText: string | null;
  answerInput: string;
  onAnswerInputChange: (value: string) => void;
  isRevisionMode: boolean;
  hasPreviousAnswerForCurrentQuestion: boolean;
  onCopyPreviousAnswer: () => void;
  onCancelRevision: () => void;
  onSubmitAnswer: () => void;
  onReviseClick: () => void;
  onNextQuestion: () => void;
  onFinish: () => void;
  onStartNewSession: () => void;
  onDownloadRecap: () => void;
  canRevise: boolean;
  canNext: boolean;
  canFinish: boolean;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function PracticeView({
  companyLabel,
  isFictionalExample,
  focusLabel,
  messages,
  questionsAsked,
  answersAttempted,
  isFinished,
  recapText,
  answerInput,
  onAnswerInputChange,
  isRevisionMode,
  hasPreviousAnswerForCurrentQuestion,
  onCopyPreviousAnswer,
  onCancelRevision,
  onSubmitAnswer,
  onReviseClick,
  onNextQuestion,
  onFinish,
  onStartNewSession,
  onDownloadRecap,
  canRevise,
  canNext,
  canFinish,
  isLoading,
  error,
  onRetry,
}: PracticeViewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRevisionMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isRevisionMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, isLoading, isFinished]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isLoading && answerInput.trim()) {
        onSubmitAnswer();
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && answerInput.trim()) {
      onSubmitAnswer();
    }
  };

  return (
    <div className="space-y-6">
      {/* Session progress & metadata bar */}
      <div className="bg-white border border-[#E2DCD0] rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#1C1917]">
            <span className="font-serif font-medium text-base">
              {companyLabel || "Stock-pitch rehearsal"}
            </span>
            {isFictionalExample && (
              <>
                <span aria-hidden="true" className="text-[#A8A29E]">
                  ·
                </span>
                <span className="text-xs font-medium text-[#143B2B]">
                  Fictional example
                </span>
              </>
            )}
            <span aria-hidden="true" className="text-[#A8A29E]">
              ·
            </span>
            <span className="text-xs text-[#57534E]">Focus: {focusLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#57534E] tabular-nums">
            <span>
              Questions asked:{" "}
              <strong className="font-medium text-[#1C1917]">
                {questionsAsked} of 3
              </strong>
            </span>
            <span aria-hidden="true" className="text-[#A8A29E]">
              ·
            </span>
            <span>
              Answers attempted:{" "}
              <strong className="font-medium text-[#1C1917]">
                {answersAttempted} of 3
              </strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartNewSession}
          className="self-start sm:self-auto shrink-0 whitespace-nowrap min-h-[40px] px-4 py-2 text-sm font-medium text-[#292524] bg-[#FBF9F5] border border-[#D6CFC2] rounded-lg hover:bg-[#F3EFE6] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143B2B]"
        >
          Start a new session
        </button>
      </div>

      {/* Conversation thread */}
      <section
        aria-label="Coaching conversation"
        className="space-y-4"
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <article
              key={msg.id}
              className={`rounded-xl px-5 py-4 sm:px-6 sm:py-5 border ${
                isUser
                  ? "bg-[#F3EFE6] border-[#DDD5C5] ml-4 sm:ml-10"
                  : "bg-white border-[#E2DCD0] mr-0 sm:mr-6"
              }`}
            >
              <div className="flex items-center gap-2 mb-2 text-xs text-[#57534E]">
                <span className="font-semibold text-[#1C1917]">
                  {isUser ? "You" : "PitchCheck Coach"}
                </span>
                {isUser && msg.kind === "revision" && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Revision</span>
                  </>
                )}
              </div>

              {isUser ? (
                <p className="text-[15px] leading-[1.65] text-[#1C1917] whitespace-pre-wrap">
                  {msg.text}
                </p>
              ) : (
                <MarkdownContent text={msg.text} />
              )}
            </article>
          );
        })}

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl px-5 py-4 bg-white border border-[#E2DCD0] text-sm text-[#57534E] mr-0 sm:mr-6"
          >
            PitchCheck Coach is reviewing your response…
          </div>
        )}

        <div ref={bottomRef} />
      </section>

      {/* Error banner with Retry */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[#FDF2F2] border border-[#E2B4B4] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <p className="text-sm text-[#7F1D1D]">
            <span className="font-semibold">Error:</span> {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="shrink-0 whitespace-nowrap min-h-[40px] px-4 py-2 text-sm font-medium text-[#7F1D1D] bg-white border border-[#D9A0A0] rounded-lg hover:bg-[#FAF0F0] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7F1D1D]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Finished recap panel or active answer composer */}
      {isFinished ? (
        <section
          aria-labelledby="recap-heading"
          className="bg-white border border-[#D4CDC0] rounded-xl p-6 sm:p-7 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#ECE7DC]">
            <div>
              <h2
                id="recap-heading"
                className="font-serif text-xl font-medium text-[#1C1917]"
              >
                Session complete
              </h2>
              <p className="mt-1 text-sm text-[#57534E] tabular-nums">
                Answers attempted: {answersAttempted} of 3 · Questions asked:{" "}
                {questionsAsked} of 3
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[#57534E]">
            The full conversation remains visible above. Download the coach&apos;s
            recap as a plain text file or start a new session when you are ready.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onDownloadRecap}
              disabled={!recapText}
              className="whitespace-nowrap min-h-[44px] px-5 py-2.5 text-sm font-medium text-[#143B2B] bg-[#F4F1EA] border border-[#CFC7B8] rounded-lg hover:bg-[#EAE5DA] transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143B2B]"
            >
              Download recap
            </button>
            <button
              type="button"
              onClick={onStartNewSession}
              className="whitespace-nowrap min-h-[44px] px-5 py-2.5 text-sm font-medium text-[#FAF8F3] bg-[#143B2B] rounded-lg hover:bg-[#0F2E21] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143B2B]"
            >
              Start a new session
            </button>
          </div>
        </section>
      ) : (
        <form
          onSubmit={handleFormSubmit}
          className="bg-white border border-[#E2DCD0] rounded-xl p-5 sm:p-6 space-y-4"
        >
          {isRevisionMode && (
            <div className="px-4 py-3 rounded-lg bg-[#F7F4EC] border border-[#DDD5C5] flex flex-wrap items-center justify-between gap-2 text-sm text-[#292524]">
              <span>
                Revising your answer to Question {questionsAsked} of 3 (keeps the
                same question).
              </span>
              <div className="flex items-center gap-3">
                {hasPreviousAnswerForCurrentQuestion && (
                  <button
                    type="button"
                    onClick={onCopyPreviousAnswer}
                    className="text-xs font-medium text-[#143B2B] underline underline-offset-2 hover:text-[#0F2E21]"
                  >
                    Copy previous answer
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCancelRevision}
                  className="text-xs font-medium text-[#57534E] underline underline-offset-2 hover:text-[#1C1917]"
                >
                  Cancel revision
                </button>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="practice-input"
              className="block text-sm font-medium text-[#1C1917]"
            >
              {questionsAsked === 0
                ? "Your response"
                : `Your answer${isRevisionMode ? ` (revising Question ${questionsAsked} of 3)` : ""}`}
            </label>
            <textarea
              ref={textareaRef}
              id="practice-input"
              rows={4}
              value={answerInput}
              disabled={isLoading}
              onChange={(e) => onAnswerInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                questionsAsked === 0
                  ? "Reply with the requested detail, a correction, or 'Stop here.' (Ctrl/Cmd+Enter to send)"
                  : "Write your answer, a revision, 'next', or 'Stop here.' (Ctrl/Cmd+Enter to send)"
              }
              className="mt-1.5 w-full px-3.5 py-2.5 text-[15px] leading-relaxed text-[#1C1917] bg-[#FBF9F5] border border-[#D6CFC2] rounded-lg placeholder:text-[#8C857B] focus:bg-white focus:border-[#143B2B] focus:outline-none focus:ring-2 focus:ring-[#143B2B]/15 disabled:opacity-60"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                disabled={isLoading || !answerInput.trim()}
                className="whitespace-nowrap min-h-[44px] px-5 py-2.5 text-sm font-medium text-[#FAF8F3] bg-[#143B2B] rounded-lg hover:bg-[#0F2E21] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143B2B]"
              >
                Submit answer
              </button>

              <button
                type="button"
                onClick={onReviseClick}
                disabled={!canRevise}
                className="whitespace-nowrap min-h-[44px] px-4 py-2.5 text-sm font-medium text-[#1C1917] bg-[#FBF9F5] border border-[#D6CFC2] rounded-lg hover:bg-[#F3EFE6] transition-colors disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143B2B]"
              >
                Revise
              </button>

              <button
                type="button"
                onClick={onNextQuestion}
                disabled={!canNext}
                className="whitespace-nowrap min-h-[44px] px-4 py-2.5 text-sm font-medium text-[#1C1917] bg-[#FBF9F5] border border-[#D6CFC2] rounded-lg hover:bg-[#F3EFE6] transition-colors disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143B2B]"
              >
                Next question
              </button>
            </div>

            <button
              type="button"
              onClick={onFinish}
              disabled={!canFinish}
              className="whitespace-nowrap min-h-[44px] px-4 py-2.5 text-sm font-medium text-[#57534E] bg-white border border-[#D6CFC2] rounded-lg hover:bg-[#F3EFE6] hover:text-[#1C1917] transition-colors disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143B2B]"
            >
              Finish
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
