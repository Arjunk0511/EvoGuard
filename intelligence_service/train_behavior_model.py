"""
Place at: intelligence_service/train_behavior_model.py

Trains the v3 Behavioral Classification Model — now including keystroke
features alongside the existing 81 mouse features — and saves artifacts
in the exact format model_service.py expects:

    behavior_model_v3.pkl      -> a single fitted sklearn Pipeline
                                   (StandardScaler -> SelectKBest -> LogisticRegression)
                                   model_service.py calls .predict()/.predict_proba()
                                   directly on this object.
    feature_columns_v3.pkl     -> list of ALL feature names the pipeline
                                   was trained on (order doesn't matter at
                                   inference time — model_service.py
                                   reindexes by name — but must match here).
    model_metadata_v3.pkl      -> dict with at least 'features_selected',
                                   which model_service.py prints on load.

Usage:
    pip install scikit-learn pandas numpy joblib --break-system-packages
    python export_dataset.py --mongo-uri "..." --out sessions.jsonl
    python train_behavior_model.py --data sessions.jsonl
"""

import argparse
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from intelligence_service.services.behavior_features import (
    BehavioralFeatureExtractor,
)
from intelligence_service.config import MODELS_DIR


def load_sessions(path):
    extractor = BehavioralFeatureExtractor()
    rows = []
    skipped = 0

    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            record = json.loads(line)

            try:
                features = extractor.extract(record["events"])
            except ValueError:
                skipped += 1
                continue

            features["label"] = record["label"]
            rows.append(features)

    print(f"Loaded {len(rows)} sessions ({skipped} skipped as invalid)")
    return pd.DataFrame(rows)


def train(df, k_best=20, test_size=0.2):
    feature_columns = [c for c in df.columns if c != "label"]

    X = df[feature_columns].values
    y = (df["label"] == "bot").astype(int).values  # 1 = bot, 0 = human

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )

    k = min(k_best, len(feature_columns))

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("select", SelectKBest(score_func=f_classif, k=k)),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)),
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    print("=== Behavioral Classification Model v3 — Evaluation ===")
    print(classification_report(y_test, y_pred, target_names=["human", "bot"]))
    print("Confusion matrix (rows=true, cols=pred, order=[human, bot]):")
    print(confusion_matrix(y_test, y_pred))
    if len(np.unique(y_test)) > 1:
        print(f"ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")

    selected_mask = pipeline.named_steps["select"].get_support()
    selected_features = [f for f, keep in zip(feature_columns, selected_mask) if keep]
    print(f"\nSelected features ({len(selected_features)}): {selected_features}")

    metadata = {
        "version": "v3",
        "features_total": len(feature_columns),
        "features_selected": len(selected_features),
        "selected_feature_names": selected_features,
    }

    return pipeline, feature_columns, metadata


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to .jsonl session data")
    parser.add_argument("--out-dir", default=MODELS_DIR)
    parser.add_argument("--k-best", type=int, default=20)
    args = parser.parse_args()

    df = load_sessions(args.data)
    print(f"Class balance: {(df['label'] == 'bot').sum()} bot, "
          f"{(df['label'] == 'human').sum()} human")

    pipeline, feature_columns, metadata = train(df, k_best=args.k_best)

    joblib.dump(pipeline, f"{args.out_dir}/behavior_model_v3.pkl")
    joblib.dump(feature_columns, f"{args.out_dir}/feature_columns_v3.pkl")
    joblib.dump(metadata, f"{args.out_dir}/model_metadata_v3.pkl")

    print(f"\nSaved v3 model artifacts to {args.out_dir}/")
    print("Next: update config.py to point at the *_v3.pkl files, then restart app.py")


if __name__ == "__main__":
    main()