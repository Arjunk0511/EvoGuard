class BehavioralRiskEngine:

    def __init__(
        self,
        low_threshold=30,
        medium_threshold=60,
        high_threshold=80
    ):

        self.low_threshold = low_threshold
        self.medium_threshold = medium_threshold
        self.high_threshold = high_threshold

    def calculate_risk(self, confidence):

        # Confidence is between 0 and 1.
        #
        # High confidence in a known behavioral
        # pattern = lower behavioral risk.
        #
        # Low confidence = higher behavioral risk.

        risk_score = (
            1.0 - confidence
        ) * 100

        risk_score = max(
            0,
            min(
                100,
                risk_score
            )
        )

        risk_score = round(
            risk_score,
            2
        )

        if risk_score < self.low_threshold:

            status = "LOW"

        elif risk_score < self.medium_threshold:

            status = "MEDIUM"

        elif risk_score < self.high_threshold:

            status = "HIGH"

        else:

            status = "CRITICAL"

        return {
            "risk_score": risk_score,
            "status": status
        }