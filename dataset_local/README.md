# EvoGuard dataset collection without MongoDB

This mode collects your own mouse-and-keyboard sessions with ONE Node.js server. It needs Node 20+ and a browser. It does not require MongoDB, Express, npm install, React, Python, .env or the original store backend to run.

It adds `dataset_local/` inside EvoGuard and preserves your existing project. The local storefront uses a fixed sample catalog with homepage/product browsing, search, scrolling and cart add/remove tasks. It reuses the v2 behavioral sensor/storage logic from the earlier package.

## Run

Extract `EvoGuard_NoMongo_Collection.zip` into your EvoGuard root. It contains the dataset_local folder.

From PowerShell at the EvoGuard root:

```powershell
Expand-Archive -LiteralPath (Join-Path $env:USERPROFILE 'Downloads\EvoGuard_NoMongo_Collection.zip') -DestinationPath .
node .\dataset_local\server.cjs
```

Open `http://localhost:5002/data-collection` (or `http://127.0.0.1:5002/data-collection`). Keep this terminal running. Do not start the old root server.js, Flipkart backend or React server for this mode. No MongoDB connection string is needed.

If port 5002 is already in use, choose another local port before starting:

```powershell
$env:EVOGUARD_DATASET_PORT = '5003'
node .\dataset_local\server.cjs
```

Use the address printed by the server. The module sends data to its own origin, so no separate frontend URL setting is needed. To relocate data, set EVOGUARD_DATASET_DIR to an absolute directory before starting; it otherwise writes to the standard project dataset directory below.

## First test session

1. Use user00 for your own implementation test. Do not treat setup/testing sessions as the final research cohort by default.
2. Select mouse/touchpad and read/accept the participant notice.
3. Start recording. Watch the captured and acknowledged counters.
4. Browse the homepage, search for shoes/headphones/backpacks, open products, scroll, add two items to the cart and remove one.
5. Return to the collection page and type its practice sentence. Avoid personal details.
6. Click Stop and save; wait for the saved confirmation. The control panel stays available across navigation.
7. Download the raw JSON if desired. The server has also saved it to disk.

A one-minute session is sufficient for the first operational check. Later pilot sessions should be 3–5 minutes each with two sessions per volunteer. We will review the first result before enrolling classmates.

## Raw files

Default directory:

```text
EvoGuard/intelligence_service/datasets/evoguard_behavior/evoguard_pilot_v1/raw/user00/<session_id>.json
```

At the EvoGuard root, inspect the most recently saved user00 session:

```powershell
$rawDir = '.\intelligence_service\datasets\evoguard_behavior\evoguard_pilot_v1\raw\user00'
$sessionFile = Get-ChildItem -LiteralPath $rawDir -Filter '*.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($null -ne $sessionFile) {
    node .\dataset_local\inspectSession.cjs $sessionFile.FullName
} else {
    Write-Host 'No raw session saved yet. Check the browser panel and server terminal.'
}
```

The summary shows completion, duration, event totals, collection protocol and quality flags. Send this output as the next checkpoint. Do not manually edit events or relabel interrupted sessions as complete.

## Health and automated checks

In another PowerShell terminal:

```powershell
Invoke-RestMethod 'http://localhost:5002/api/behavior/dataset/v2/health'
```

Expected: success=True, storage=local_json, mongo_required=False.

At the EvoGuard root:

```powershell
node --test .\dataset_local\tests\store.test.cjs .\dataset_local\tests\collector.test.cjs .\dataset_local\tests\http.test.cjs
```

28 tests passed during development. They cover actual HTTP server requests and on-disk saves plus simulated-browser checks for privacy, pairing, throttling, cleanup and retries. Test data is created in temporary directories and removed, never inserted into the real dataset. Browser modules were syntax-checked. The complete visual page has not been exercised in a real browser here, so the local recording check remains necessary.

## Privacy, provenance and research scope

- Mouse timestamps/coordinates/button remain together in each admitted event.
- Timing uses monotonic, session-relative milliseconds. Mouse movement sampling is limited to one event per 25 ms.
- Only the explicitly approved search/practice fields collect keyboard timing. No raw key identity, text value, clipboard content, search string or full route identifier enters serialized behavioral events.
- Keydown/keyup pairs use opaque press IDs. Repeats/composition and incomplete pairs are handled explicitly.
- Search strings appear transiently in the browser's URL and UI because they drive the task. Stored behavioral page names are sanitized route templates. Browser history itself is not collected.
- Participant codes are pseudonymous; behavioral patterns can distinguish people. Read and follow the notice before enrolling volunteers. The notice sets manual deletion within 30 days after final project evaluation; no automatic deletion is claimed.
- Cart contents and product prices are sample task data. No real purchases or accounts exist here.
- These are real browser interaction sessions collected in a local task environment, not generated training events. Metadata records `protocol_version: evomart_local_tasks_v1` and `collector_version: custom_collector_2.0.1`. The original Flipkart mode uses a different protocol. Keep the environments distinguishable when grouping/evaluating data; do not silently pool them or claim live Flipkart model performance.
- The first release accepts human participants only. A future bot dataset needs separately recorded automation provenance and fair evaluation.
- Dataset collection, feature processing, model training and a Python inference service can all use JSON/CSV/model files without MongoDB. The existing full Flipkart app and IDS log routes still depend on their current MongoDB implementation; this mode does not claim to migrate those features.

## Interrupted sessions

Acknowledged batches and retry metadata are stored under `.../evoguard_pilot_v1/state/`. The browser retains unacknowledged events in memory, with a bounded queue. Keep the tab open when Retry saving is shown. A crash/refresh can lose unacknowledged data and must not produce a false completion claim.

To export acknowledged parts of abandoned sessions, stop the Node server and run:

```powershell
node .\dataset_local\exportIncomplete.cjs
```

These raw exports are marked incomplete; source state is preserved. Missing client events cannot be recovered. Restart the server after recovery. Use one server process per dataset directory. This is a local single-operator pilot tool, not a publicly authenticated multi-user service.

## Files

- server.cjs: Node built-in HTTP server and page/API routes.
- store.cjs: v2 validation, ordered batch commits, duplicate protection and raw exports.
- public/index.html, styles.css, app.js: local browsing tasks and recording controls.
- public/behavioralSession.js, behavioralRecorder.js: versioned session creation and sensor/transport.
- inspectSession.cjs, exportIncomplete.cjs: inspection and interrupted-session export.
- tests/: storage, collector and actual HTTP checks.

No existing project files need replacement for this mode. The next step is your user00 recording output, then pilot-data validation—not model training yet.
