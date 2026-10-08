import os


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODELS_DIR = os.path.join(
    BASE_DIR,
    "models"
)

LOG_DIR = os.path.join(
    BASE_DIR,
    "logs"
)


# Model files
# NOTE: bump these to _v3 once train_behavior_model.py has produced
# behavior_model_v3.pkl / feature_columns_v3.pkl / model_metadata_v3.pkl
# and you've validated it. Don't flip this until v3 is trained — app.py
# will fail to start if these paths don't exist.
BEHAVIOR_MODEL_PATH = os.path.join(
    MODELS_DIR,
    "behavior_model_v2.pkl"
)

FEATURE_COLUMNS_PATH = os.path.join(
    MODELS_DIR,
    "feature_columns_v2.pkl"
)

MODEL_METADATA_PATH = os.path.join(
    MODELS_DIR,
    "model_metadata_v2.pkl"
)


# API configuration
HOST = "127.0.0.1"
PORT = 5001
DEBUG = True


# Behavioral risk thresholds
LOW_RISK_THRESHOLD = 30
MEDIUM_RISK_THRESHOLD = 60
HIGH_RISK_THRESHOLD = 80