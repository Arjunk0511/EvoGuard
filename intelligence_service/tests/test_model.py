from intelligence_service.services.model_service import (
    BehavioralModelService
)


print("=" * 60)
print("BEHAVIORAL MODEL LOADING TEST")
print("=" * 60)


try:

    model_service = BehavioralModelService()

    print()
    print("Model loaded successfully.")

    print()
    print(
        "Number of expected features:",
        len(model_service.feature_columns)
    )

    print()
    print("First 10 features:")

    for feature in model_service.feature_columns[:10]:
        print(f"  - {feature}")

    print()
    print("Model metadata:")

    for key, value in model_service.metadata.items():

        if key != "selected_features":
            print(f"  {key}: {value}")

    print()
    print("=" * 60)
    print("MODEL TEST PASSED")
    print("=" * 60)


except Exception as error:

    print()
    print("=" * 60)
    print("MODEL TEST FAILED")
    print("=" * 60)

    print()
    print("Error:")
    print(error)

    raise