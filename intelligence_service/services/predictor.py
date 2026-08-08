from intelligence_service.services.model_service import (
    BehavioralModelService
)

from intelligence_service.services.behavior_features import (
    BehavioralFeatureExtractor
)

from intelligence_service.services.risk_engine import (
    BehavioralRiskEngine
)


class BehavioralPredictor:

    def __init__(self):

        self.feature_extractor = (
            BehavioralFeatureExtractor()
        )

        self.model_service = (
            BehavioralModelService()
        )

        self.risk_engine = (
            BehavioralRiskEngine()
        )

    # --------------------------------------------------
    # PREDICT FROM RAW BEHAVIORAL EVENTS
    # --------------------------------------------------

    def predict_from_events(self, events):

        # --------------------------------------------------
        # STEP 1
        # Extract behavioral features
        # --------------------------------------------------

        features = (
            self.feature_extractor.extract(
                events
            )
        )

        # --------------------------------------------------
        # STEP 2
        # Model prediction
        #
        # 81 generated features
        #        ↓
        # required 40 features
        #        ↓
        # StandardScaler
        #        ↓
        # SelectKBest
        #        ↓
        # 20 selected features
        #        ↓
        # Logistic Regression
        # --------------------------------------------------

        prediction = (
            self.model_service.predict(
                features
            )
        )

        # --------------------------------------------------
        # STEP 3
        # Get confidence
        # --------------------------------------------------

        confidence = prediction.get(
            "confidence"
        )

        if confidence is None:

            raise ValueError(
                "Model confidence is unavailable."
            )

        # --------------------------------------------------
        # STEP 4
        # Calculate behavioral risk
        # --------------------------------------------------

        risk = (
            self.risk_engine.calculate_risk(
                confidence
            )
        )

        # --------------------------------------------------
        # STEP 5
        # Final result
        # --------------------------------------------------

        return {

            "prediction":
                prediction.get(
                    "prediction"
                ),

            "confidence":
                confidence,

            "probabilities":
                prediction.get(
                    "probabilities"
                ),

            "risk_score":
                risk["risk_score"],

            "risk_status":
                risk["status"],

            "features_generated":
                len(features)
        }