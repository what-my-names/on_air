# Random Triple-Chain (random_chain)

> **Current Release Status**: Beta v1.0.0 (Pre-release). Functional but still being polished; feedback welcome.

> **Authorship Notice**: This project is a "novice × AI creation" — co-developed by a novice developer together with an AI assistant. The code and docs are still growing; corrections, issues and PRs are welcome.

> **Platform Notice**: This plugin is built exclusively for **Operit AI** (an Android AI assistant app) and runs inside its sandboxed ToolPkg runtime. It does not work on other platforms.
>
> - Operit official repo: https://github.com/AAswordman/Operit
> - Script & toolpkg development docs: https://cdn.jsdelivr.net/gh/AAswordman/Operit@main/docs/SCRIPT_DEV_SKILL.md

A sandboxed ToolPkg plugin for Operit AI: after the user goes silent for a while, the AI "takes the initiative" to message the user, following a smoothly rising probability curve.

## Features

- **Triple-chain state machine**: idle patrol on a timer, per-minute accumulation while running, and a hit wakes the AI to speak proactively
- **Smooth probability formula**: `f = a·x + b·x^c`, `y = 100·f / (1 + f)`, where x is minutes of silence
  - Defaults: `a=0.007078203`, `b=6.00914e-07`, `c=3.15168`
  - Reference curve: x=60 → ~40%, x=120 → ~75%, x=180 → ~90%, monotonically increasing, approaching 100%
- **Natural wake-up wording**: the wake message exposes no mechanism keywords; the AI speaks as if it thought of the user on its own
- **Character-card name targeting**: messages are routed by "character card name" lookup — no manual chat ID config needed; leave it empty to follow the current chat
- **Instant trigger**: manual trigger returns immediately without waiting for the AI reply; panel clicks take effect at once
- **Chinese-only replies**: all wake-up wording is forced to Chinese output
- **Cooldown & consecutive-hit cap**: cooldown after each hit; proactive messages stop automatically when consecutive hits reach the cap
- **Gentle Guardian linkage**: when the "Gentle Guardian" plugin is running, its jealousy counter is updated (capped, no penalty tier)
- **Sidebar panel**: live x/y state, manual trigger, reset cooldown/counter, edit formula params, character card name, wording and send mode

## Directory Layout

```
src/
  main.js                          # entry
  manifest.json                    # toolpkg manifest
  packages/random_chain.js         # core logic (tool implementation)
  ui/xy_panel/index.ui.js          # sidebar panel
  resources/random_chain_workflow_market.json  # workflow template
formula.example.json               # config example (copy to formula.json)
```

## Installation

1. Place the whole directory into the Operit AI plugin dir on the device: `/sdcard/Download/Operit/plugins/random_chain/`
2. In the Operit AI app, use "debug burn" to install `src/manifest.json` (or import a packaged `.toolpkg` into the external package dir)
3. Import the workflows (three chains) provided by `resources/random_chain_workflow_market.json`
4. Open "Random Triple-Chain" in the sidebar panel and tweak parameters as needed

## Configuration (formula.json)

| Field | Description |
| --- | --- |
| a / b / c | Formula params: `f = a·x + b·x^c` |
| idle_threshold_minutes | Silence threshold (minutes); accumulation starts after it |
| cooldown_minutes | Cooldown after a wake (minutes) |
| awake_mode | `default` = AI free-form with context; `custom` = use local wording library |
| send_mode | A1/A2 only; both wake inside the chat, body text only |
| max_wake_stops | Cap on consecutive proactive messages |
| character_card_name | Character card located by name when waking; empty follows current chat |
| awake_messages | Custom wording library (one phrase per line) |
| ai_gateway | Optional: call an LLM API directly to generate wording |

Do not commit real runtime data (`formula.json`, `state.json`) to the repo.

## License

MIT License
