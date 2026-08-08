import joblib
import numpy as np
import pandas as pd

from intelligence_service.config import (
    BEHAVIOR_MODEL_PATH,
    FEATURE_COLUMNS_PATH,
    MODEL_METADATA_PATH
)


class BehavioralModelService:

    def __init__(self):

        print("[MODEL] Loading behavioral model...")

        self.model = joblib.load(
            BEHAVIOR_MODEL_PATH
        )

        self.feature_columns = joblib.load(
            FEATURE_COLUMNS_PATH
        )

        self.metadata = joblib.load(
            MODEL_METADATA_PATH
        )

        print(
            "[MODEL] Behavioral model loaded successfully."
        )

        print(
            f"[MODEL] Expected features: "
            f"{len(self.feature_columns)}"
        )

        print(
            f"[MODEL] Selected features: "
            f"{self.metadata.get('features_selected', 'N/A')}"
        )

    # --------------------------------------------------
    # PREPARE FEATURES
    # --------------------------------------------------

    def prepare_features(self, features):

        if not isinstance(features, dict):

            raise ValueError(
                "Features must be provided as a dictionary."
            )

        missing_features = [
            feature
            for feature in self.feature_columns
            if feature not in features
        ]

        if missing_features:

            raise ValueError(
                "Missing required features: "
                + ", ".join(missing_features)
            )

        # --------------------------------------------------
        # IMPORTANT:
        # Use EXACT training feature order
        # --------------------------------------------------

        feature_data = {
            feature: features[feature]
            for feature in self.feature_columns
        }

        dataframe = pd.DataFrame(
            [feature_data],
            columns=self.feature_columns
        )

        # --------------------------------------------------
        # NUMERIC VALIDATION
        # --------------------------------------------------

        dataframe = dataframe.apply(
            pd.to_numeric,
            errors="coerce"
        )

        if dataframe.isnull().any().any():

            invalid_columns = (
                dataframe.columns[
                    dataframe.isnull().any()
                ].tolist()
            )

            raise ValueError(
                "Invalid numeric values found in: "
                + ", ".join(invalid_columns)
            )

        # --------------------------------------------------
        # FINITE VALUE CHECK
        # --------------------------------------------------

        values = dataframe.to_numpy(
            dtype=float
        )

        if not np.isfinite(values).all():

            raise ValueError(
                "Features contain NaN or infinite values."
            )

        return dataframe

    # --------------------------------------------------
    # PREDICTION
    # --------------------------------------------------

    def predict(self, features):

        dataframe = self.prepare_features(
            features
        )

        # --------------------------------------------------
        # MODEL PIPELINE
        # --------------------------------------------------

        prediction = self.model.predict(
            dataframe
        )

        # Convert numpy value to normal Python value
        predicted_class = prediction[0]

        if hasattr(
            predicted_class,
            "item"
        ):

            predicted_class = (
                predicted_class.item()
            )

        # --------------------------------------------------
        # PROBABILITY
        # --------------------------------------------------

        probabilities = None

        if hasattr(
            self.model,
            "predict_proba"
        ):

            probabilities = (
                self.model.predict_proba(
                    dataframe
                )[0]
            )

        # --------------------------------------------------
        # CONFIDENCE
        # --------------------------------------------------

        if probabilities is not None:

            confidence = float(
                np.max(probabilities)
            )

        else:

            confidence = None

        return {
            "prediction": predicted_class,
            "confidence": confidence,
            "probabilities": (
                probabilities.tolist()
                if probabilities is not None
                else None
            )
        }