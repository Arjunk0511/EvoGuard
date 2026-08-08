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