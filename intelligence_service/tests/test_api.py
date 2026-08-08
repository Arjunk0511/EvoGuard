import requests


# ============================================================
# CONFIGURATION
# ============================================================

API_URL = "http://127.0.0.1:5001/api/predict"


# ============================================================
# CREATE TEST BEHAVIORAL EVENTS
# ============================================================

events = []

timestamp = 1000


# Mouse movement events
for i in range(100):

    events.append({
        "type": "mousemove",
        "x": 500 + (i * 3),
        "y": 300 + i,
        "timestamp": timestamp
    })

    timestamp += 20


# Click event
events.append({
    "type": "click",
    "x": 800,
    "y": 450,
    "timestamp": timestamp
})

timestamp += 100


# Mouse down
events.append({
    "type": "mousedown",
    "x": 800,
    "y": 450,
    "timestamp": timestamp
})

timestamp += 50


# Mouse up
events.append({
    "type": "mouseup",
    "x": 800,
    "y": 450,
    "timestamp": timestamp
})


# ============================================================
# REQUEST PAYLOAD
# ============================================================

payload = {
    "events": events
}


# ============================================================
# DISPLAY TEST INFORMATION
# ============================================================

print("=" * 70)
print("EVOGUARD INTELLIGENCE SERVICE - API TEST")
print("=" * 70)

print()
print("API URL:")
print(API_URL)

print()
print("Number of events:")
print(len(events))

print()
print("Sending request...")


# ============================================================
# SEND REQUEST
# ============================================================

try:

    response = requests.post(
        API_URL,
        json=payload,
        timeout=30
    )


    # ========================================================
    # HTTP STATUS
    # ========================================================

    print()
    print("HTTP STATUS:")
    print(response.status_code)


    # ========================================================
    # RESPONSE
    # ========================================================

    print()
    print("SERVER RESPONSE:")
    print("-" * 70)

    try:

        result = response.json()

        print(result)

    except Exception:

        print(response.text)

        result = None


    # ========================================================
    # VALIDATE RESPONSE
    # ========================================================

    print()
    print("=" * 70)

    if response.status_code == 200:

        print("HTTP TEST: PASSED")

    else:

        print("HTTP TEST: FAILED")


    # ========================================================
    # DISPLAY PREDICTION RESULT
    # ========================================================

    if result and result.get("success"):

        prediction_result = result.get(
            "result",
            {}
        )

        print()
        print("BEHAVIORAL PREDICTION")
        print("-" * 70)

        print(
            "Prediction          :",
            prediction_result.get("prediction")
        )

        print(
            "Confidence          :",
            prediction_result.get("confidence")
        )

        print(
            "Risk Score          :",
            prediction_result.get("risk_score")
        )

        print(
            "Risk Status         :",
            prediction_result.get("risk_status")
        )

        print(
            "Features Generated  :",
            prediction_result.get("features_generated")
        )

        print()
        print("API TEST: SUCCESS")

    else:

        print()
        print("API TEST: FAILED")
        print("Server did not return a successful prediction.")


except requests.exceptions.ConnectionError:

    print()
    print("=" * 70)
    print("CONNECTION ERROR")
    print("=" * 70)

    print()
    print(
        "Could not connect to the Intelligence Service."
    )

    print()
    print(
        "Make sure Flask is running on:"
    )

    print(
        "http://127.0.0.1:5001"
    )


except requests.exceptions.Timeout:

    print()
    print("ERROR: Request timed out.")


except Exception as error:

    print()
    print("=" * 70)
    print("UNEXPECTED ERROR")
    print("=" * 70)

    print(error)


print()
print("=" * 70)