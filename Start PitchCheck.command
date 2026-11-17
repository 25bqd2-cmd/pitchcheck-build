#!/bin/zsh
set -e
cd "${0:A:h}"
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then source "$HOME/.nvm/nvm.sh"; fi
if ! command -v npm >/dev/null; then
  print "PitchCheck needs Node.js. Install Node.js, then open this file again."
  read "?Press Return to close."
  exit 1
fi
if ! command -v codex >/dev/null; then
  export PITCHCHECK_CODEX_BIN="/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex"
fi
if [[ ! -d node_modules ]]; then npm ci --ignore-scripts; fi
if [[ ! -f dist/index.html ]]; then npm run build; fi
export PITCHCHECK_PROVIDER=codex
export PORT=7121
if curl --silent --max-time 2 http://127.0.0.1:7121/api/status | /usr/bin/grep -q 'Local Codex'; then
  open http://127.0.0.1:7121
  exit 0
fi
npm start &
pitchcheck_pid=$!
trap 'kill "$pitchcheck_pid" 2>/dev/null || true' EXIT INT TERM
for pitchcheck_try in {1..40}; do
  if curl --silent --max-time 1 http://127.0.0.1:7121/api/status | /usr/bin/grep -q 'Local Codex'; then
    open http://127.0.0.1:7121
    break
  fi
  sleep 0.25
done
print "PitchCheck is running. Keep this window open while practising. Close it to stop the app."
wait "$pitchcheck_pid"
