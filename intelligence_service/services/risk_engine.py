# ==========================================
# Risk Engine
# ==========================================


def calculate_behavior_risk(prediction, confidence):

    confidence = confidence * 100

    if prediction == 1:

        risk = confidence

    else:

        risk = 100 - confidence

    risk = max(0, min(100, risk))

    return round(risk)