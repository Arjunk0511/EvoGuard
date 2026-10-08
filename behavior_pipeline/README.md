# EvoGuard pilot feature pipeline

Extract this ZIP at your EvoGuard project root. Requires Python 3.10+ only.

PowerShell:

```powershell
python .\behavior_pipeline\extract.py --input .\intelligence_service\datasets\evoguard_behavior\evoguard_pilot_v1\raw --output .\behavior_output
python -m unittest discover -s .\behavior_pipeline -p "test_*.py"
```

You may pass EvoGuard_Pilot_Raw.zip as --input instead. Raw inputs are never modified. Output files are overwritten on rerun; use a different output directory to preserve previous outputs.

## Included
- extract.py: shared feature function and batch CLI.
- test_extract.py: four regression tests.
- pilot_results: generated outputs for the supplied 11 recordings.

features.jsonl has one row per session. validation.json records processing errors and coverage warnings. Features include mouse movement speed and distance, mouse button hold timing, scroll distance, keyboard hold timing and keydown-to-keydown intervals. Distances use CSS pixels; mouse speed uses CSS pixels/second; keyboard timing uses milliseconds. Summary standard deviations are population values. Missing measurements remain null. Mouse path is the sampled path, not the full physical movement. Scroll distance may include programmatic scrolling. Long gaps remain part of elapsed time; no active-time or acceleration claims are made.

The extractor resets movement and keyboard timing at capture/context boundaries and skips zero-time mouse derivatives. Keyboard pairing uses press_id, never raw key text. It intentionally uses a new feature schema: do NOT feed these rows into the old model.

All supplied pilot identities are unknown. Original IDs are retained only for traceability. participant_id=null and evaluation_eligible=false are intentional. These data support pipeline development, not a participant-independent accuracy claim. This CLI is for this pilot batch; new known-identity collections need a separate validated participant manifest before training. Participant IDs and session IDs must never be classifier inputs.

For new recordings, reuse user01/user02-style IDs accepted by the existing collector; keep a private mapping to actual participants. Do not use P001 unless you also change collector validation. Keep new recordings in a separate dataset directory from the unknown-identity pilot.

## Completion path
1. Verify this extraction command locally.
2. Collect labeled automation on the same local storefront through the same collector, with separate automation provenance. Never relabel human pilot rows as bots or fabricate evaluation scores.
3. Collect known-participant human sessions for held-out evaluation. Keep all sessions from a participant together; keep automation runs and variants grouped to avoid leakage.
4. Compare window coverage before choosing live-window duration. Train and infer using the same windowing and extract() function. A live window must carry duration_ms and locally rebased timestamps/sequence numbers; context boundaries must remain present.
5. Fit preprocessing on training data only. Report class counts, grouped split, confusion matrix, precision/recall, and limitations. With insufficient groups, show a demonstration without claiming generalization.
6. Integrate behavioral evidence with existing request-risk handling. Missing keyboard data or an unavailable model must produce insufficient-evidence status, not an automatic bot verdict. Preserve existing IDS rules and baseline models.

This package implements extraction and pilot validation only. It does not yet train a model, generate bots, or modify the running IDS.
