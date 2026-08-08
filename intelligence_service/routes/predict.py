# ==========================================
# Prediction Route
# ==========================================

from flask import Blueprint, request

from services.predictor import predictor
from services.risk_engine import calculate_behavior_risk
from services.feature_validator import validate_features

from utils.response import success, error
from utils.logger import logger

predict_bp = Blueprint("predict", __name__)


@predict_bp.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        valid, missing = validate_features(data)

        if not valid:
            return error(f"Missing Features: {missing}")

        result = predictor.predict(data)

        behavior_risk = calculate_behavior_risk(
            result["prediction"],
            result["confidence"]
        )

        response = {

            "prediction": result["prediction"],

            "confidence": round(result["confidence"], 4),

            "behaviorRisk": behavior_risk

        }

        logger.info(response)

        return success(response)

    except Exception as e:

        logger.exception(e)

        return error(str(e))