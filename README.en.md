# Random Triple-Chain (random_chain)

[中文](README.md)
> **Current Release Status**: v1.7.10-beta (Pre-release). Functional but still being polished; feedback welcome.

> **Authorship Notice**: This project is a "novice × AI creation" — co-developed by a novice developer together with an AI assistant. The code and docs are still growing; corrections, issues and PRs are welcome.

> **Platform Notice**: This plugin is built exclusively for **Operit AI** (an Android AI assistant app) and runs inside its sandboxed ToolPkg runtime. It does not work on other platforms.
>
> - Operit official repo: https://github.com/AAswordman/Operit
> - Script & toolpkg development docs: https://cdn.jsdelivr.net/gh/AAswordman/Operit@main/docs/SCRIPT_DEV_SKILL.md


> **Supported version**: developed and tested on **Operit AI 1.12.1** (Android); earlier versions may lack some ToolPkg capabilities, 1.12.1 or newer is recommended.
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
- **Quiet periods**: independent day/night quiet segments with customizable time ranges (for shift work, naps, classes, etc.)
- **Calendar quiet**: three-color calendar highlight (today purple, quiet days dark, others bright); any date can be tapped for full-day hard quiet — one tap to apply, tap again to cancel
- **School-day auto quiet**: ordinary days (non-holiday, non-weekend, non-vacation in student mode) are automatically hard-quiet all day
- **Student mode switch**: on = summer/winter vacation counts as special days (stay colorful); off = adult mode, vacations treated as ordinary days
- **Date quiet master switch**: one tap disables all date-level quiet (tapped quiet days and school-day auto quiet)
- **Built-in 2026 Chinese public holidays**: fetches holidays online after 12:00 daily to auto-recognize special days
- **Privacy-safe sample stats**: only message timestamps and sender identity are read to detect silence — message content is never read or stored
- **Sidebar panel**: live x/y state, manual trigger, reset cooldown/counter, edit formula params, character card name, wording, quiet & calendar settings

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
| quiet_enabled | Quiet master switch (period quiet) |
| quiet_day_enabled / quiet_night_enabled | Independent day / night segment switches |
| quiet_day_start / quiet_day_end | Day segment HH:MM (default 09:00~18:00) |
| quiet_night_start / quiet_night_end | Night segment HH:MM (default 22:00~09:00, overnight) |
| quiet_dates | Tapped full-day quiet date map, e.g. `{"2026-08-18":"full"}` |
| school_day_auto_quiet | School-day auto quiet switch |
| student_mode | Student mode switch |
| date_quiet_enabled | Date quiet master switch |

Do not commit real runtime data (`formula.json`, `state.json`) to the repo.


## Public API (for other plugins / workflows)

Every tool exported by this plugin is auto-registered by the Operit framework, so other plugins and workflows can call them directly with the `random_chain:` prefix.

**Getting started**: call `random_chain:api_docs` first to get full docs for all tools (parameters, return shape, examples).

| Tool | Purpose | Example |
| --- | --- | --- |
| get_xy | Read current state (x, y, cooldown, formula) | `random_chain:get_xy` |
| compute_y | Compute probability y from the formula | `random_chain:compute_y {x:20}` |
| set_x | Manually set x | `random_chain:set_x {x:5}` |
| increment_x | Increment x by 1 | `random_chain:increment_x` |
| check_activity | Check the user's last speaking time | `random_chain:check_activity {threshold_minutes:10}` |
| roll_dice | Roll with current y as probability | `random_chain:roll_dice` |
| manual_awake | Manually trigger one wake message | `random_chain:manual_awake` |
| coax | Coax: reset counters and link Gentle Guardian | `random_chain:coax` |
| reset_cooldown | Reset / set cooldown | `random_chain:reset_cooldown {minutes:0}` |
| update_formula | Update formula and config params | `random_chain:update_formula {a:0.007}` |
| get_formula | Read formula config | `random_chain:get_formula` |
| maybe_awake | Running-state roll; only a hit sends a message | `random_chain:maybe_awake` |
| enter_running | Enter running state and start accumulation | `random_chain:enter_running` |
| api_docs | Return the API docs of all tools | `random_chain:api_docs` |

All tools return `{success, message, data}`; parameters are passed as an object and are optional unless marked required.

## Versioning (SemVer)

Versions follow semantic versioning X.Y.Z:

| Change | Version bump | Example |
| --- | --- | --- |
| Small fix (backward-compatible) | Patch +1 | v1.0.0 → v1.0.1 |
| New feature / bigger improvement (backward-compatible) | Minor +1, patch reset to 0 | v1.0.5 → v1.1.0 |
| Breaking change | Major +1, minor & patch reset to 0 | v1.9.2 → v2.0.0 |

Beta releases carry a `-beta` suffix (e.g. `v1.0.0-beta`); stable releases use a plain version number.
## License

MIT License