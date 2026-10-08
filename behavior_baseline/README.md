# EvoGuard exploratory behavioral baseline

Extract behavior_baseline into the EvoGuard project root. This is a separate model; existing models and collectors are unchanged.

## Run now — Python only, no additional packages for scoring

The trained model is already included. From the EvoGuard root in PowerShell:

```powershell
python .\behavior_baseline\baseline.py score --input .\intelligence_service\datasets\evoguard_behavior\evoguard_pilot_v1\raw
```

To score a bot run, replace INPUT with its raw folder:

```powershell
python .\behavior_baseline\baseline.py score --input .\bot_collection\output\7934dc31-d376-4002-adfb-92d9058715df\raw
```

Output contains one result per full 30-second window. bot_score is a 0–1 uncalibrated model output, NOT a verified attack probability. Sparse windows return insufficient_evidence and null score. Do not block users or redirect them on this score alone. Scoring these same training recordings is a pipeline check, not an evaluation.

## Included artifacts

- baseline.py: ZIP validation, training, portable scoring, shared windowing.
- features.py: shared feature extraction copied from the previous pilot package.
- model/model.json: portable JSON logistic regression parameters; no pickle dependency.
- model/report.json: archive validation results, coverage and limitations.
- model/training_windows.jsonl: 52 feature rows with source session/provenance.
- test files: seven focused regression tests.

## Training

Validated 11 human and 12 bot sessions, including manifest SHA256 checks for every bot. Failed attempt in the old manifest is excluded. Both generator versions are retained. Four complete sessions per bot profile. 10 human and 12 bot sessions contribute 16 human and 36 bot windows. No participant-independent evaluation is possible because human identities are unknown. No accuracy, precision or recall is claimed. All eligible data are used for exploratory fitting.

Nine inputs: mean, population standard deviation and median of mouse speed (CSS pixels/second), keyboard hold duration (milliseconds), and keydown-to-keydown interval (milliseconds). IDs, origin, profile, labels, total duration and task counts are excluded from model inputs. Task and device differences can still affect these nine measurements. StandardScaler and LogisticRegression(C=1,max_iter=2000) are fitted with weights that give each class equal total weight and each contributing session equal weight within its class. No tuning is performed.

Window contract: non-overlapping [start,start+30000) intervals anchored at session start. Discard incomplete final intervals. Rebase event sequence/timestamps per window. Reset pairs at each window boundary; a key press spanning windows is excluded from hold measurements in both. Context/capture boundaries also reset timing. At least 5 valid mouse-speed pairs and 5 key-hold pairs per window are required; these are provisional coverage gates, not validated security thresholds. Sparse windows abstain; they are not labeled human or bot. Future live buffers must use precisely this same windows()/extract() contract.

Optional retraining (put the three uploaded ZIPs in the project root):

```powershell
python -m pip install scikit-learn==1.8.0
python .\behavior_baseline\baseline.py train --human .\EvoGuard_Pilot_Raw.zip --bots .\EvoGuard_Bot_Raw_f9515734-7efa-4dbc-8c88-4d89b2e838c8.zip .\EvoGuard_Bot_Raw_7934dc31-d376-4002-adfb-92d9058715df.zip --output .\behavior_baseline\retrained
python -m unittest discover -s .\behavior_baseline -p "test_*.py"
```

Training validates provenance, counts, timestamps, duplicates and bot manifests before fitting. Exported scores are checked against sklearn to tolerance 1e-10. Included model was trained using sklearn 1.8.0. Raw data is never changed. Use a new --output directory to retain previous models.

## Integration status and next step

This package scores files and exposes Python functions; it does not yet modify the IDS gateway or wire the frontend to live scoring. Connect the same window pipeline to a local scoring endpoint, return score plus evidence status, and display it alongside existing request-rule risk. Keep request detection operational independently. New known-participant human sessions and independent automation families are needed before choosing enforcement thresholds or claiming generalization. Do not randomly split windows from the same source across training/test; retain participant, session and bot-family grouping.

Reference: https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html
