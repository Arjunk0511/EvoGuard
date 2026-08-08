# ==========================================
# Predictor Service
# ==========================================

import joblib
import pandas as pd

from config import MODEL_PATH, SCALER_PATH, FEATURE_PATH


class BehaviorPredictor:

    def __init__(self):

        print("Loading Behavioral ML Model...")

        self.model = joblib.load(MODEL_PATH)

        self.scaler = joblib.load(SCALER_PATH)

        self.feature_columns = joblib.load(FEATURE_PATH)

        print("Model Loaded Successfully")

    def predict(self, feature_dict):

        df = pd.DataFrame([feature_dict])

        df = df[self.feature_columns]

        prediction = self.model.predict(df)[0]

        probability = self.model.predict_proba(df)[0]

        confidence = float(max(probability))

        return {

            "prediction": int(prediction),

            "confidence": confidence

    }


predictor = BehaviorPredictor()