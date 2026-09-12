import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

model = joblib.load(
    os.path.join(
        BASE_DIR,
        "model",
        "isolation_forest.pkl"
    )
)

scaler = joblib.load(
    os.path.join(
        BASE_DIR,
        "model",
        "scaler.pkl"
    )
)

def detect(features):

    X = scaler.transform([features])

    prediction = model.predict(X)[0]

    raw_score = model.decision_function(X)[0]

    print("Prediction:", prediction)
    print("Raw Score:", raw_score)

    if prediction == 1:

        # Normal traffic
        anomaly_score = max(
            0,
            min(
                49,
                int((0.3 - raw_score) * 100)
            )
        )

    else:

        # Anomalous traffic
        anomaly_score = min(
            100,
            max(
                70,
                int(70 + abs(raw_score) * 100)
            )
        )

    print("Anomaly Score:", anomaly_score)

    return prediction, anomaly_score