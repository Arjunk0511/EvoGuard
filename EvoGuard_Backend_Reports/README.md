# EvoGuard backend behavior reports

Uses your existing reference scorer and reference ZIPs. No new admin page and no MongoDB. The shopping frontend has no score panel and receives only acknowledgements. Scores are computed in the backend process, printed in its terminal, and saved in `behavior_reports/reports/<session_id>.json`.

## Install (PowerShell)
Extract this package into your EvoGuard folder so `EvoGuard_Backend_Reports/install.py` exists.

```powershell
Set-Location -LiteralPath "C:\Users\Arjun\OneDrive\문서\GitHub\EvoGuard"
python .\EvoGuard_Backend_Reports\install.py
```
The installer backs up the two frontend files it replaces. It adds `behavior_reports/`, leaves the existing scorer and datasets intact, and checks for the duplicate EvoGuardPanel. Keep your existing EvoGuardLive mount in App.js. No unsigned PowerShell installer is needed.

Stop the old `behavior_reference/service.py` terminal with Ctrl+C. The replacement uses the SAME port, 5006, and imports the scoring code directly:

```powershell
python .\behavior_reports\server.py
```
In another terminal:

```powershell
Set-Location -LiteralPath "C:\Users\Arjun\OneDrive\문서\GitHub\EvoGuard\flipkart-mern-master\flipkart-mern-master\frontend"
npm start
```
Open your frontend using its printed URL (3000 or 4000 supported). A visit entry is created when the backend connection succeeds. Browse and type into the shopping search field for 30 seconds. The backend prints `[BEHAVIOR REPORT]` with the actual result. No historical 24.2 result is inserted; scores are calculated from new activity.

## Inspect backend reports now
From the EvoGuard root:

```powershell
$latestReport = Get-ChildItem .\behavior_reports\reports\*.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($latestReport) { Get-Content -LiteralPath $latestReport.FullName -Raw }
```
Each file includes the visit ID, UTC visit start and last submission time, identity (anonymous), each window's score and evidence, comparison, scorer method, and observation-only action. Before a complete window, status is `awaiting_evidence`. Windows without enough movement/typing have `insufficient_evidence` and a null score. Files survive backend restarts. Raw events and literal typed text are not saved in these reports.

## API for your teammate's existing admin backend
The startup terminal prints a private admin report token. Test it in PowerShell:

```powershell
$reportToken = Read-Host 'Paste the admin report token printed by the backend'
$headers = @{ Authorization = "Bearer $reportToken" }
Invoke-RestMethod 'http://127.0.0.1:5006/reports' -Headers $headers | ConvertTo-Json -Depth 20
# Detail: replace SESSION_ID with one returned above
Invoke-RestMethod 'http://127.0.0.1:5006/reports/SESSION_ID' -Headers $headers | ConvertTo-Json -Depth 20
```
`GET /reports` returns `{reports:[...]}` with summaries. `GET /reports/{session_id}` returns the full report including `windows[].result`. The existing admin backend should call these endpoints after checking its logged-in admin role, and relay reports to its admin UI. Keep this service token on the server; do not embed it in React or shopper requests. A token is generated on each start unless EVOGUARD_REPORT_TOKEN is set privately in the backend environment.

`POST /sessions` returns a visit ID and restricted session token. `POST /windows` accepts `{session_id,window_index,window}` with that session token. It returns only `{accepted:true,window_index}`. Session tokens cannot read reports. The old `/score` endpoint is not exposed by this server.

For MongoDB integration, replace `save`, `read_report`, and report listing with your teammate's storage adapter. Resolve logged-in user identity from the middleware's authenticated session, not a user ID supplied by the browser. `user_id` is deliberately null until that integration. This local test adapter does not connect to the existing middleware's session or request risk engine.

## Testing limits and lifecycle
- Local testing service, bound to 127.0.0.1, Python standard library only. Not a production HTTP server.
- A visit means one page load/mount; SPA navigation stays in that visit. Refresh creates another visit. It does not identify a person across visits.
- After restarting the backend, refresh the frontend to create a new active session. Saved reports remain readable, but session tokens are in memory.
- Short visits remain `awaiting_evidence`; partial windows on tab close are not scored. Delayed/background or overflowing windows are skipped by the existing recorder. Last received time is not a confirmed logout time.
- Collection starts after the local backend responds. Backend outages prevent collection/session registration; window delivery is retried once. Browser telemetry can be manipulated and is advisory, not proof of identity or attack.
- Up to 10,000 live sessions per process and 10,000 submitted window indices per visit. Reports have no automatic retention deletion; manage private files locally.
- Exclude `/behavior_reports/reports/`, `/report_patch_backup_*/`, and `/EvoGuard_Backend_Reports/` from GitHub. Keep reference ZIPs in their original folder.

## Undo
Stop the report server; copy the backed-up EvoGuardLive.jsx and referenceRecorder.js from the printed backup folder to their original frontend locations. Restart the original `python .\behavior_reference\service.py` and refresh the frontend. Preserve reports if needed.
