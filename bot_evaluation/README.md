# EvoGuard frozen-model bot test

Extract bot_evaluation into the EvoGuard root. Uses the already installed Python Playwright, Chromium, and Node. No MongoDB needed. Existing collectors, training data and models are not changed.

Run:

```powershell
python .\bot_evaluation\run_test_bots.py --sessions 9 --seconds 180
```

Leave the browser in front and do not interact. The runner starts its own local server on port 5005. Use --port 5006 if occupied. Nine sessions cycle through three profiles, three repetitions each. Each recording lasts at least approximately 180 seconds; completion of the current task sequence adds time. Expect more than 27 minutes total.

Profiles are burst_pause (short key bursts with longer pauses), curved_motion (paced curved mouse paths with eased speed and different key timings), and slow_reading (slower movement, longer typing gaps and action pauses). They are new scripted variants, not independent real-world bot families: the browser automation engine and broad task sequence remain the same as training. The task has the same browsing/search/cart/practice components. It deliberately does not tune timing based on model predictions.

Each run writes test_output/<UUID>/raw plus manifest.json and produces EvoGuard_Bot_Test_<UUID>.zip in this folder. The manifest records profile, seed, generator version, source hashes, model hash, completion/failure state, event counts and raw hashes. Failed sessions are not included as completed recordings. Keep the original model frozen and never add these recordings to training before reporting this evaluation.

If a run fails after N successful sessions, preserve its ZIP. Resume with --start-index N --sessions (9-N), replacing the expressions with actual numbers. For example, after 3 successes:

```powershell
python .\bot_evaluation\run_test_bots.py --start-index 3 --sessions 6 --seconds 180
```

Upload both partial and resumed ZIPs. Failure screenshots are in the output directory. Do not silently omit failed or low-coverage sessions from reporting.

Optional local evaluation (replace the example filename with the printed archive path):

```powershell
python .\bot_evaluation\evaluate.py --archive .\bot_evaluation\EvoGuard_Bot_Test_RUN_ID.zip
```

The evaluator needs only Python standard library. It validates raw hashes/provenance and scores full 30-second windows with the unchanged model. The threshold is fixed at 0.5 and the original minimum 5 mouse-speed pairs + 5 key-hold pairs gate remains. It reports recall among scored bot windows, coverage, abstentions, and detections as a fraction of all full windows. It does not miscount abstentions as correct detections. Incomplete final windows are excluded by the original window contract.

Human evaluation reference: user13–user15 are unseen participants (9 sessions, 16/51 windows scored, 0/16 false alarms at 0.5). user11–user12 are returning participants and must be reported separately (6 sessions, 15/33 scored, 0/15 false alarms). These small, correlated samples do not establish population accuracy. Do not combine training bot results with human test results to claim test accuracy.

Checks performed: Python syntax/CLI validation and three deterministic pattern tests. Full browser execution remains to be verified on your Windows machine; no test-bot data or accuracy results have been fabricated. The included collector is copied from the earlier working bot collector, including its reliable locator clicks and cart-state checks.
