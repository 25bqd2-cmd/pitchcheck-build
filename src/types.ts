export type PracticeFocus =
  | "Balanced"
  | "Business drivers"
  | "Valuation"
  | "Risks";

export interface PitchSetup {
  company: string;
  thesis: string;
  notes: string;
  noEvidenceYet: boolean;
  focus: PracticeFocus;
  firstQuestionFocus: string;
  isFictionalExample: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  kind?: "setup" | "intake" | "answer" | "revision" | "command" | "coach";
}

export type PendingAction =
  | {
      type: "start";
      initialMessage: string;
    }
  | {
      type: "answer" | "revision" | "next" | "finish";
      text: string;
      questionNumberAtSend: number;
    };
