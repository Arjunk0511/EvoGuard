import joblib

from intelligence_service.config import (
    BEHAVIOR_MODEL_PATH,
    FEATURE_COLUMNS_PATH,
    MODEL_METADATA_PATH
)


print("=" * 70)
print("MODEL FILE INSPECTION")
print("=" * 70)


# --------------------------------------------------
# MODEL
# --------------------------------------------------

model = joblib.load(
    BEHAVIOR_MODEL_PATH
)

print("\nMODEL")
print("-" * 70)

print(
    "Type:",
    type(model)
)

print(
    "Model:",
    model
)


# --------------------------------------------------
# FEATURE COLUMNS
# --------------------------------------------------

feature_columns = joblib.load(
    FEATURE_COLUMNS_PATH
)

print("\nFEATURE COLUMNS")
print("-" * 70)

print(
    "Type:",
    type(feature_columns)
)

print(
    "Number:",
    len(feature_columns)
)

for index, feature in enumerate(
    feature_columns,
    start=1
):

    print(
        f"{index:02d}. {feature}"
    )


# --------------------------------------------------
# METADATA
# --------------------------------------------------

metadata = joblib.load(
    MODEL_METADATA_PATH
)

print("\nMETADATA")
print("-" * 70)

print(
    "Type:",
    type(metadata)
)

if isinstance(metadata, dict):

    for key, value in metadata.items():

        print(
            f"{key}: {value}"
        )

else:

    print(metadata)


# --------------------------------------------------
# MODEL PIPELINE
# --------------------------------------------------

print("\nMODEL STEPS")
print("-" * 70)

if hasattr(model, "named_steps"):

    for name, step in model.named_steps.items():

        print(
            f"{name}: {type(step).__name__}"
        )

print("\n" + "=" * 70)
print("INSPECTION COMPLETE")
print("=" * 70)