import math


class FeatureValidator:

    def __init__(self, expected_features):
        self.expected_features = expected_features

    def validate(self, features):

        if not isinstance(features, dict):
            raise ValueError(
                "Features must be provided as a dictionary."
            )

        missing = [
            feature
            for feature in self.expected_features
            if feature not in features
        ]

        if missing:
            raise ValueError(
                "Missing features: "
                + ", ".join(missing)
            )

        invalid = []

        for feature in self.expected_features:

            value = features[feature]

            if not isinstance(
                value,
                (int, float)
            ):
                invalid.append(
                    f"{feature} is not numeric"
                )
                continue

            if not math.isfinite(value):
                invalid.append(
                    f"{feature} contains NaN/Infinity"
                )

        if invalid:
            raise ValueError(
                "Invalid feature values: "
                + "; ".join(invalid)
            )

        return True