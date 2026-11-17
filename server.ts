import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { FINAL_TESTED_SYSTEM_PROMPT } from "./src/systemPrompt.ts";

interface IncomingMessage {
  role: "user" | "model";
  text: string;
}

const MODEL_ID = "gemini-3.5-flash-lite";
const MAX_OUTPUT_TOKENS = 2048;

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function isValidMessages(value: unknown): value is IncomingMessage[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      (item.role === "user" || item.role === "model") &&
      typeof item.text === "string" &&
      item.text.trim().length > 0,
  );
}

function extractUpstreamDetail(rawMessage: string): string {
  const jsonStart = rawMessage.indexOf("{");
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(rawMessage.slice(jsonStart)) as {
        error?: { message?: string };
      };
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // Ignore parse failure
    }
  }
  return rawMessage;
}

function formatApiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const sdkStatus =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status?: unknown }).status === "number"
      ? (err as { status: number }).status
      : null;
  const statusMatch = rawMessage.match(/\b(400|401|403|404|429|500|502|503|504)\b/);
  const statusCode = sdkStatus ?? (statusMatch ? Number(statusMatch[1]) : 500);
  const detail = extractUpstreamDetail(rawMessage);

  if (
    statusCode === 403 ||
    rawMessage.includes("API_KEY_INVALID") ||
    rawMessage.includes("PERMISSION_DENIED")
  ) {
    return {
      status: 403,
      message: `Gemini API key is missing or invalid (${detail}). Please check the API key in the Settings > Secrets panel and click Retry.`,
    };
  }

  if (statusCode === 429 || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message: `Rate limit or quota reached (${detail}). Please wait a moment and click Retry, or select a billing-enabled API key in Settings > Secrets.`,
    };
  }

  if (statusCode === 404 || rawMessage.includes("NOT_FOUND")) {
    return {
      status: 502,
      message: `Model ${MODEL_ID} returned 404 (${detail}).`,
    };
  }

  return {
    status: statusCode >= 400 && statusCode < 600 ? statusCode : 502,
    message: `Gemini API error (${statusCode}): ${detail}`,
  };
}

async function generateCoachReply(
  ai: GoogleGenAI,
  messages: IncomingMessage[],
): Promise<string> {
  const contents = messages.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents,
      config: {
        systemInstruction: FINAL_TESTED_SYSTEM_PROMPT,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Empty response returned from Gemini.");
    }
    return text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isThinkingUnsupported =
      message.toLowerCase().includes("thinking") &&
      (message.includes("400") || message.toLowerCase().includes("invalid"));

    if (isThinkingUnsupported) {
      const fallbackResponse = await ai.models.generateContent({
        model: MODEL_ID,
        contents,
        config: {
          systemInstruction: FINAL_TESTED_SYSTEM_PROMPT,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      });
      const fallbackText = fallbackResponse.text?.trim();
      if (!fallbackText) {
        throw new Error("Empty response returned from Gemini.");
      }
      return fallbackText;
    }

    throw err;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body ?? {};
    if (!isValidMessages(messages)) {
      res.status(400).json({
        error: "Please enter a non-empty message before submitting.",
      });
      return;
    }

    try {
      const ai = getAiClient();
      const reply = await generateCoachReply(ai, messages);
      res.json({ reply });
    } catch (err) {
      const formatted = formatApiError(err);
      // Do not log user-submitted notes, thesis, or answers.
      console.error(`Gemini chat request failed with status ${formatted.status}`);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  const distDir = path.resolve(process.cwd(), "dist");
  const distIndex = path.join(distDir, "index.html");
  const isProd =
    process.env.NODE_ENV === "production" ||
    (process.env.NODE_ENV !== "development" && fs.existsSync(distIndex));

  if (isProd && fs.existsSync(distIndex)) {
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(distIndex);
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`PitchCheck server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error(
    "Failed to start PitchCheck server:",
    err instanceof Error ? err.message : "unknown error",
  );
  process.exit(1);
});
