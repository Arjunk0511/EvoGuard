import joblib

from intelligence_service.services.behavior_features import (
    BehavioralFeatureExtractor
)

from intelligence_service.config import (
    FEATURE_COLUMNS_PATH
)


extractor = BehavioralFeatureExtractor()

# --------------------------------------------------
# TEST EVENTS
# --------------------------------------------------

events = []

timestamp = 1000000

for i in range(100):

    events.append({
        "type": "mousemove",
        "x": 500 + i * 2,
        "y": 300 + i,
        "timestamp": timestamp
    })

    timestamp += 20


# --------------------------------------------------
# EXTRACT FEATURES
# --------------------------------------------------

features = extractor.extract(
    events
)


# --------------------------------------------------
# LOAD TRAINING FEATURES
# --------------------------------------------------

training_features = joblib.load(
    FEATURE_COLUMNS_PATH
)


generated_features = list(
    features.keys()
)


# --------------------------------------------------
# COMPARISON
# --------------------------------------------------

print("=" * 70)
print("FEATURE COMPATIBILITY TEST")
print("=" * 70)

print(
    f"\nTraining features : {len(training_features)}"
)

print(
    f"Generated features: {len(generated_features)}"
)


# --------------------------------------------------
# MISSING FEATURES
# --------------------------------------------------

missing = [
    feature
    for feature in training_features
    if feature not in generated_features
]


# --------------------------------------------------
# EXTRA FEATURES
# --------------------------------------------------

extra = [
    feature
    for feature in generated_features
    if feature not in training_features
]


print(
    f"\nMissing features: {len(missing)}"
)

if missing:

    for feature in missing:
        print(
            "  MISSING:",
            feature
        )


print(
    f"\nExtra features: {len(extra)}"
)

if extra:

    for feature in extra:
        print(
            "  EXTRA:",
            feature
        )


# --------------------------------------------------
# ORDER CHECK
# --------------------------------------------------

same_order = (
    training_features
    ==
    generated_features
)


print(
    f"\nSame feature order: {same_order}"
)


# --------------------------------------------------
# FINAL RESULT
# --------------------------------------------------

print("\n" + "=" * 70)

if (
    len(missing) == 0
    and
    len(extra) == 0
):

    print(
        "SUCCESS: Feature names are compatible."
    )

    if same_order:

        print(
            "SUCCESS: Feature order also matches."
        )

    else:

        print(
            "WARNING: Names match but order differs."
        )

else:

    print(
        "ERROR: Feature mismatch detected."
    )

print("=" * 70)