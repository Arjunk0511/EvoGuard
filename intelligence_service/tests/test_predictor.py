from intelligence_service.services.predictor import (
    BehavioralPredictor
)


print("=" * 70)
print("EVOGUARD BEHAVIORAL PREDICTOR TEST")
print("=" * 70)


# --------------------------------------------------
# CREATE PREDICTOR
# --------------------------------------------------

predictor = BehavioralPredictor()


# --------------------------------------------------
# CREATE TEST BEHAVIOR
# --------------------------------------------------

events = []

timestamp = 1000000


for i in range(100):

    events.append({

        "type": "mousemove",

        "x": 500 + (i * 2),

        "y": 300 + i,

        "timestamp": timestamp

    })

    timestamp += 20


# Add some clicks

events.append({
    "type": "click",
    "x": 700,
    "y": 400,
    "timestamp": timestamp
})

timestamp += 100

events.append({
    "type": "mousedown",
    "x": 700,
    "y": 400,
    "timestamp": timestamp
})

timestamp += 50

events.append({
    "type": "mouseup",
    "x": 700,
    "y": 400,
    "timestamp": timestamp
})


# --------------------------------------------------
# RUN PREDICTION
# --------------------------------------------------

result = predictor.predict_from_events(
    events
)


# --------------------------------------------------
# DISPLAY RESULT
# --------------------------------------------------

print("\nPREDICTION RESULT")
print("-" * 70)

print(
    "Prediction       :",
    result["prediction"]
)

print(
    "Confidence       :",
    result["confidence"]
)

print(
    "Probabilities    :",
    result["probabilities"]
)

print(
    "Risk Score       :",
    result["risk_score"]
)

print(
    "Risk Status      :",
    result["risk_status"]
)

print(
    "Features Generated:",
    result["features_generated"]
)


print("\n" + "=" * 70)


# --------------------------------------------------
# BASIC VALIDATION
# --------------------------------------------------

if result["features_generated"] == 81:

    print(
        "SUCCESS: 81 behavioral features generated."
    )

else:

    print(
        "ERROR: Unexpected feature count."
    )


if (
    0 <= result["confidence"] <= 1
):

    print(
        "SUCCESS: Confidence is valid."
    )

else:

    print(
        "ERROR: Invalid confidence."
    )


if (
    0 <= result["risk_score"] <= 100
):

    print(
        "SUCCESS: Risk score is valid."
    )

else:

    print(
        "ERROR: Invalid risk score."
    )


if result["risk_status"] in [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
]:

    print(
        "SUCCESS: Risk status is valid."
    )

else:

    print(
        "ERROR: Invalid risk status."
    )


print("=" * 70)