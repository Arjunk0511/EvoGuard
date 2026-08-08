# ==========================================
# EvoGuard Intelligence Service
# Configuration
# ==========================================

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "models", "behavior_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.pkl")
FEATURE_PATH = os.path.join(BASE_DIR, "models", "feature_columns.pkl")

HOST = "0.0.0.0"
PORT = 5001

DEBUG = True