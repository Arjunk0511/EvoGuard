"""
Place at: intelligence_service/export_dataset.py

Pulls labeled BehavioralSession documents out of MongoDB and writes
them to a .jsonl file, one session per line, ready for
train_behavior_model.py.

Usage:
    pip install pymongo --break-system-packages
    python export_dataset.py --mongo-uri "mongodb://localhost:27017/evoguard" --out sessions.jsonl
"""

import argparse
import json

from pymongo import MongoClient


def export_sessions(mongo_uri, db_name, out_path, min_events=20):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    collection = db["behavioralsessions"]  # mongoose pluralizes/lowercases the model name

    written = 0
    skipped = 0

    with open(out_path, "w") as f:
        for doc in collection.find({}):
            events = doc.get("events", [])

            if len(events) < min_events:
                skipped += 1
                continue

            record = {
                "sessionId": doc.get("sessionId"),
                "label": doc.get("label"),
                "events": events,
            }
            f.write(json.dumps(record) + "\n")
            written += 1

    print(f"Wrote {written} sessions to {out_path} (skipped {skipped} too-short sessions)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mongo-uri", required=True)
    parser.add_argument("--db", default=None)
    parser.add_argument("--out", default="sessions.jsonl")
    parser.add_argument("--min-events", type=int, default=20)
    args = parser.parse_args()

    db_name = args.db or MongoClient(args.mongo_uri).get_default_database().name
    export_sessions(args.mongo_uri, db_name, args.out, args.min_events)