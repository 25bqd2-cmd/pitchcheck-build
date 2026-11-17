# PitchCheck

A short stock-pitch practice coach for commerce students. Supply a thesis and notes, answer three questions one at a time, revise after feedback, and download the actual session recap. The Northstar Tools example is fictional. This is educational rehearsal and does not recommend trades or verify investment claims.

## Project files

The interface and original Gemini server were created in Google AI Studio Build. The source was exported and synchronized to this repository. A local Codex connection was added after the Google project reported that its Gemini API free tier was unavailable and publishing required billing. No billing was enabled.

- [Prompt development repository](https://github.com/25bqd2-cmd/pitchcheck-prompts): initial prompt, full versions after Cycles 1–4, and the main Build prompt.
- [Google AI Studio project](https://aistudio.google.com/apps/021051f1-bff6-4ceb-a713-95bc00e2e3da): original Build workspace. This is an editor link, not a published working app.
- `src/systemPrompt.ts`: complete final Cycle 4 prompt, including its original line breaks.
- `codexCoach.ts`: optional local adapter using an existing signed-in Codex CLI account.
- `server.ts`: server-side Gemini route and the local Codex route.

## Run on your Mac with existing Codex access

Requirements: Node.js and a Codex CLI account already signed in with `codex login`. Usage counts toward that account's existing limits. This route does not create an API key or enable a new paid service.

Open `Start PitchCheck.command`, or run:

```sh
npm ci --ignore-scripts
npm run build
PORT=7121 PITCHCHECK_PROVIDER=codex npm start
```

Then open `http://127.0.0.1:7121`. The local adapter binds to this Mac only. It sends the final tested prompt as developer instructions and the conversation as data to the account's default Codex model. The observed test model was `gpt-6.1-sol`, with low reasoning. Shell, browser, connected apps, plugins and web search are disabled for these coaching calls. Sessions use ephemeral CLI mode and the app does not persist notes. Inputs still go to the selected AI service to produce feedback.

## Gemini route

The original Google route remains available for a host with its own valid server-side `GEMINI_API_KEY`. It uses `gemini-3.5-flash-lite`, minimal thinking when supported, a 2,048-token output limit and no search tools. Run `npm run dev` for that route. Never put a real key in this repository or client code. The project used for this coursework could not run this route without billing, so the local Codex tests are explicitly separate from the Gemini Playground tests.

## Checks and limits

`npm run build` and `npm run lint` check the bundle and TypeScript. The workbook records actual Playground and interface tests, including observations that did not fully meet the goal. Prompt instructions reduce errors but do not guarantee correct causal reasoning or resistance to every conflicting source instruction. The model can still give plausible feedback beyond the supplied evidence. Review its feedback and check the underlying research.
