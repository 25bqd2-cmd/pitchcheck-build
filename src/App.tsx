import { useMemo, useState } from "react";
import { PracticeView } from "./components/PracticeView.tsx";
import { SetupPanel } from "./components/SetupPanel.tsx";
import { requestCoachReply } from "./lib/coachApi.ts";
import type { ChatMessage, PendingAction, PitchSetup } from "./types.ts";

const INITIAL_SETUP: PitchSetup = {
  company: "",
  thesis: "",
  notes: "",
  noEvidenceYet: false,
  focus: "Balanced",
  firstQuestionFocus: "",
  isFictionalExample: false,
};

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isCommandMessage(text: string): boolean {
  return /^(next|stop(\s+here\.?)?|finish|end(\s+session)?|quit)\.?$/i.test(
    text.trim(),
  );
}

function buildInitialMessage(setup: PitchSetup): string {
  const company = setup.company.trim();
  const thesis = setup.thesis.trim();
  const notes = setup.notes.trim();
  const firstFocus = setup.firstQuestionFocus.trim();

  const isCompletelyEmpty =
    !company &&
    !thesis &&
    !notes &&
    !setup.noEvidenceYet &&
    setup.focus === "Balanced" &&
    !firstFocus;

  if (isCompletelyEmpty) {
    return "Help me practise my stock pitch.";
  }

  const lines: string[] = [];
  if (company) {
    lines.push(`Company/case: ${company}`);
  }
  if (thesis) {
    lines.push(`Thesis: ${thesis}`);
  }
  if (setup.noEvidenceYet) {
    lines.push("Supporting notes: I have no evidence yet.");
  } else if (notes) {
    lines.push(`Supporting notes: ${notes}`);
  }

  if (setup.focus !== "Balanced" || lines.length > 0) {
    lines.push(`Focus: ${setup.focus}`);
  }
  if (firstFocus) {
    lines.push(`First-question focus: ${firstFocus}`);
  }

  if (!company && !thesis && !notes && !setup.noEvidenceYet) {
    return ["Help me practise my stock pitch.", ...lines].join("\n");
  }

  return lines.join("\n");
}

function deriveSessionMetrics(messages: ChatMessage[]) {
  let questionsAsked = 0;
  let recapText: string | null = null;
  let finalAnswersAttempted: number | null = null;

  for (const msg of messages) {
    if (msg.role !== "model") continue;

    const questionMatches = msg.text.matchAll(/\bQuestion\s+([1-3])\s+of\s+3\b/gi);
    for (const match of questionMatches) {
      const parsed = Number(match[1]);
      if (parsed >= 1 && parsed <= 3) {
        questionsAsked = parsed;
      }
    }

    const recapMatch = msg.text.match(/Answers attempted:\s*([0-3])\s+of\s+3/i);
    if (recapMatch) {
      recapText = msg.text;
      finalAnswersAttempted = Number(recapMatch[1]);
    }
  }

  return {
    questionsAsked,
    isFinished: recapText !== null,
    recapText,
    finalAnswersAttempted,
  };
}

export default function App() {
  const [setup, setSetup] = useState<PitchSetup>(INITIAL_SETUP);
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attemptedQuestions, setAttemptedQuestions] = useState<number[]>([]);
  const [lastAnswerByQuestion, setLastAnswerByQuestion] = useState<
    Record<number, string>
  >({});
  const [answerInput, setAnswerInput] = useState("");
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<PendingAction | null>(null);

  const metrics = useMemo(() => deriveSessionMetrics(messages), [messages]);
  const answersAttempted =
    metrics.finalAnswersAttempted !== null
      ? metrics.finalAnswersAttempted
      : attemptedQuestions.length;

  const lastMessage = messages[messages.length - 1];
  const hasModelReplied = lastMessage?.role === "model";

  const canRevise =
    !isLoading &&
    !metrics.isFinished &&
    hasModelReplied &&
    metrics.questionsAsked >= 1 &&
    attemptedQuestions.includes(metrics.questionsAsked);

  const canNext =
    !isLoading &&
    !metrics.isFinished &&
    hasModelReplied &&
    metrics.questionsAsked >= 1;

  const canFinish = !isLoading && !metrics.isFinished && hasModelReplied;

  const handleTryExample = () => {
    setError(null);
    setSetup({
      company: "Northstar Tools",
      thesis: "recurring service revenue could improve operating margins",
      notes:
        "service revenue was 20% of sales last year and 25% this year, overall operating margin stayed at 10%, no segment margin data is available",
      noEvidenceYet: false,
      focus: "Business drivers",
      firstQuestionFocus: "",
      isFictionalExample: true,
    });
  };

  async function callCoachApi(history: ChatMessage[]): Promise<string> {
    return requestCoachReply(
      history.map((m) => ({ role: m.role, text: m.text })),
    );
  }

  async function executeAction(action: PendingAction) {
    setError(null);
    setPendingRetry(action);
    setIsLoading(true);

    try {
      if (action.type === "start") {
        const userMsg: ChatMessage = {
          id: createId(),
          role: "user",
          text: action.initialMessage,
          kind: "setup",
        };
        const replyText = await callCoachApi([userMsg]);
        const coachMsg: ChatMessage = {
          id: createId(),
          role: "model",
          text: replyText,
          kind: "coach",
        };
        setMessages([userMsg, coachMsg]);
        setHasStarted(true);
        setPendingRetry(null);
        return;
      }

      const kind: ChatMessage["kind"] =
        action.type === "revision"
          ? "revision"
          : action.type === "next" || action.type === "finish"
            ? "command"
            : action.questionNumberAtSend === 0
              ? "intake"
              : "answer";

      const userMsg: ChatMessage = {
        id: createId(),
        role: "user",
        text: action.text,
        kind,
      };

      const nextHistory = [...messages, userMsg];
      const replyText = await callCoachApi(nextHistory);
      const coachMsg: ChatMessage = {
        id: createId(),
        role: "model",
        text: replyText,
        kind: "coach",
      };

      setMessages([...nextHistory, coachMsg]);

      const countsAsAttempt =
        action.type !== "next" &&
        action.type !== "finish" &&
        action.questionNumberAtSend >= 1 &&
        !isCommandMessage(action.text);

      if (countsAsAttempt) {
        setAttemptedQuestions((prev) =>
          prev.includes(action.questionNumberAtSend)
            ? prev
            : [...prev, action.questionNumberAtSend],
        );
        setLastAnswerByQuestion((prev) => ({
          ...prev,
          [action.questionNumberAtSend]: action.text,
        }));
      }

      if (action.type === "answer" || action.type === "revision") {
        setAnswerInput("");
      }
      setIsRevisionMode(false);
      setPendingRetry(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reach the coaching service. Please click Retry.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleStartPractice = () => {
    const initialMessage = buildInitialMessage(setup);
    void executeAction({ type: "start", initialMessage });
  };

  const handleSubmitAnswer = () => {
    const trimmed = answerInput.trim();
    if (!trimmed || isLoading || metrics.isFinished) return;

    const isRevision =
      isRevisionMode ||
      (metrics.questionsAsked >= 1 &&
        attemptedQuestions.includes(metrics.questionsAsked) &&
        !isCommandMessage(trimmed));

    void executeAction({
      type: isRevision ? "revision" : "answer",
      text: trimmed,
      questionNumberAtSend: metrics.questionsAsked,
    });
  };

  const handleReviseClick = () => {
    if (!canRevise) return;
    const trimmed = answerInput.trim();
    if (trimmed) {
      void executeAction({
        type: "revision",
        text: trimmed,
        questionNumberAtSend: metrics.questionsAsked,
      });
    } else {
      setIsRevisionMode(true);
    }
  };

  const handleNextQuestion = () => {
    if (!canNext) return;
    void executeAction({
      type: "next",
      text: "next",
      questionNumberAtSend: metrics.questionsAsked,
    });
  };

  const handleFinish = () => {
    if (!canFinish) return;
    void executeAction({
      type: "finish",
      text: "Stop here.",
      questionNumberAtSend: metrics.questionsAsked,
    });
  };

  const handleRetry = () => {
    if (!pendingRetry || isLoading) return;
    void executeAction(pendingRetry);
  };

  const handleStartNewSession = () => {
    setHasStarted(false);
    setSetup(INITIAL_SETUP);
    setMessages([]);
    setAttemptedQuestions([]);
    setLastAnswerByQuestion({});
    setAnswerInput("");
    setIsRevisionMode(false);
    setError(null);
    setPendingRetry(null);
    setIsLoading(false);
  };

  const handleDownloadRecap = () => {
    if (!metrics.recapText) return;

    const headerLines = ["PitchCheck Practice Recap"];
    if (setup.company.trim()) {
      headerLines.push(
        `Case: ${setup.company.trim()}${setup.isFictionalExample ? " (Fictional example)" : ""}`,
      );
    }
    if (setup.focus !== "Balanced") {
      headerLines.push(`Focus: ${setup.focus}`);
    }

    const content = `${headerLines.join("\n")}\n\n${metrics.recapText}\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pitchcheck-recap.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const previousAnswerForCurrent =
    lastAnswerByQuestion[metrics.questionsAsked] ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      <header className="bg-[#143B2B] text-[#FAF8F3] border-b border-[#0E2B1F]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6 sm:py-7">
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight">
            PitchCheck
          </h1>
          <p className="mt-1 text-sm sm:text-[15px] text-[#DCE6DF]">
            Practise defending your stock thesis.
          </p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        {!hasStarted ? (
          <SetupPanel
            setup={setup}
            onChange={setSetup}
            onTryExample={handleTryExample}
            onStart={handleStartPractice}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
          />
        ) : (
          <PracticeView
            companyLabel={setup.company.trim()}
            isFictionalExample={setup.isFictionalExample}
            focusLabel={setup.focus}
            messages={messages}
            questionsAsked={metrics.questionsAsked}
            answersAttempted={answersAttempted}
            isFinished={metrics.isFinished}
            recapText={metrics.recapText}
            answerInput={answerInput}
            onAnswerInputChange={setAnswerInput}
            isRevisionMode={isRevisionMode}
            hasPreviousAnswerForCurrentQuestion={Boolean(
              previousAnswerForCurrent,
            )}
            onCopyPreviousAnswer={() => setAnswerInput(previousAnswerForCurrent)}
            onCancelRevision={() => setIsRevisionMode(false)}
            onSubmitAnswer={handleSubmitAnswer}
            onReviseClick={handleReviseClick}
            onNextQuestion={handleNextQuestion}
            onFinish={handleFinish}
            onStartNewSession={handleStartNewSession}
            onDownloadRecap={handleDownloadRecap}
            canRevise={canRevise}
            canNext={canNext}
            canFinish={canFinish}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
          />
        )}
      </main>

      <footer className="max-w-3xl w-full mx-auto px-5 sm:px-8 pb-8 pt-2 text-xs text-[#78716C] border-t border-[#ECE7DC]">
        <p className="pt-4">
          PitchCheck is an educational rehearsal tool for commerce students, not
          investment advice. Inputs are sent to Gemini to generate feedback; the
          app does not persist notes, verify claims, or guarantee accurate
          feedback.
        </p>
      </footer>
    </div>
  );
}
