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

    prediction = model.predict(X)

    score = model.decision_function(X)[0]

    anomaly_score = int(
        max(
            0,
            min(
                100,
                (1 - score) * 100
            )
        )
    )

    return prediction[0], anomaly_score