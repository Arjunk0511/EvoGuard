from flask import Flask, request, jsonify
from utils.anomaly_detector import detect

app = Flask(__name__)

@app.route("/")
def home():
    return "EvoGuard Intelligence Service Running"

@app.route("/anomaly", methods=["POST"])
def anomaly():

    data = request.json

    prediction, score = detect(
        data["features"]
    )

    if prediction == 1:

        if score < 30:
            status = "NORMAL"
        else:
            status = "SUSPICIOUS"

    else:
        status = "ANOMALOUS"

    return jsonify({
        "anomaly_score": score,
        "confidence": round(score / 100, 2),
        "prediction": int(prediction),
        "status": status
    })

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )