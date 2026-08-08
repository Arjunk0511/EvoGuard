# ==========================================
# Feature Validator
# ==========================================

from config import FEATURE_PATH
import joblib

required_features = joblib.load(FEATURE_PATH)


def validate_features(data):

    missing = []

    for feature in required_features:

        if feature not in data:

            missing.append(feature)

    if missing:

        return False, missing

    return True, []