# EvoGuard local bot collection

Extract bot_collection into your EvoGuard root. Existing dataset_local and human recordings are untouched.

Requirements: Node 20+ and Python 3.10+. Install once in PowerShell:

```powershell
python -m pip install playwright
python -m playwright install chromium
```

First run one smoke-test session:

```powershell
python .\bot_collection\run_bots.py --sessions 1 --seconds 20
```

Then collect 12 sessions across three profiles:

```powershell
python .\bot_collection\run_bots.py --sessions 12 --seconds 90
```

The program starts and stops its own separate server on 127.0.0.1:5003. No second terminal, MongoDB or npm install is needed. If occupied use --port 5004. A visible Chromium browser opens: leave it in front and do not interact with it while collecting. Mouse clicks and typing are automated. At least the requested duration is collected; finishing the current task cycle and saving adds time.

Outputs: bot_collection/output/<run UUID>/raw/user9xxx/<session UUID>.json and manifest.json. A ready-to-upload EvoGuard_Bot_Raw_<UUID>.zip is printed on completion (or partial failure). Failed sessions are listed in the manifest but not included as successful raw recordings in the ZIP. Reruns get a new run UUID and do not overwrite previous runs. Incomplete state may remain in the run folder for diagnosis; do not use it for training.

## What is collected

- Actual browser-generated mouse, keyboard and scroll events pass through the same behavioralRecorder.js as the human collector, unchanged.
- Same sample catalog, tasks, event schema, throttling and context boundaries.
- Separate collector metadata and server validator enforce behavior_label=bot, data_origin=playwright_browser, dataset_version=evoguard_bot_v1, consent.status=not_applicable.
- user9xxx codes are transport-compatible run identifiers, NOT human participant identities. Use manifest run_id/profile/seed and session_id for provenance.
- Profiles: instant (short holds and direct moves), uniform (fixed timing), variable (seeded timing variation). These are scripted automation examples, not all real-world bots, and not evidence of malicious intent.
- Manifest includes completed session hashes, duration, event counts and profile grouping. Group automation variants by profile when designing evaluation; changing a seed is not a new independent bot family.

## Testing and limits

Python compilation and 15 Node storage/validation tests passed in the build environment. An end-to-end Chromium run was not possible there because the browser and Python Playwright package were unavailable. Run the smoke test before the batch. This package has no trained model and makes no accuracy claim.

```powershell
node --test .\bot_collection\collector\tests\store.test.cjs
```

Existing pilot features are whole-session summaries. Before training, compare modality coverage and adopt the same windowing for human data, bot data and live inference. Otherwise duration/task differences can dominate classification. Preserve raw sessions and manifest. Do not feed participant IDs, origin, labels, profile, seed or consent into classifier inputs. The prior feature-extraction CLI deliberately marks all inputs pilot-only; its identity fields are not a replacement for this automation manifest.

Unknown human identities in the old pilot preclude a valid participant-independent evaluation. New known-participant human recordings are still needed for that claim. A demonstration trained on pilot data must be clearly labeled exploratory.

Playwright references:
- https://playwright.dev/python/docs/input
- https://playwright.dev/python/docs/api/class-keyboard
- https://playwright.dev/python/docs/api/class-mouse
