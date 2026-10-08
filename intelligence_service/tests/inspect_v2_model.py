import joblib

from intelligence_service.config import (
    BEHAVIOR_MODEL_PATH,
    FEATURE_COLUMNS_PATH,
    MODEL_METADATA_PATH
)


print("=" * 70)
print("EVOGUARD V2 MODEL INSPECTION")
print("=" * 70)

model = joblib.load(
    BEHAVIOR_MODEL_PATH
)

feature_columns = joblib.load(
    FEATURE_COLUMNS_PATH
)

metadata = joblib.load(
    MODEL_METADATA_PATH
)


print("\nMODEL PATH:")
print(BEHAVIOR_MODEL_PATH)

print("\nMODEL TYPE:")
print(type(model))

print("\nMODEL STRUCTURE:")

if hasattr(model, "named_steps"):

    for name, step in model.named_steps.items():

        print(
            f"{name}: {type(step).__name__}"
        )

else:

    print(
        "Model is not a sklearn Pipeline."
    )


print("\nCLASSES:")

if hasattr(model, "classes_"):

    print(model.classes_)

    print(
        "Number of classes:",
        len(model.classes_)
    )

else:

    print(
        "No classes_ attribute found."
    )


print("\nEXPECTED FEATURES:")

print(
    "Feature count:",
    len(feature_columns)
)

for index, feature in enumerate(
    feature_columns,
    start=1
):

    print(
        f"{index:02d}. {feature}"
    )


print("\nMETADATA:")

for key, value in metadata.items():

    print(
        f"{key}: {value}"
    )


print("\n" + "=" * 70)
print("INSPECTION COMPLETE")
print("=" * 70)