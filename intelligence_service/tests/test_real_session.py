from pathlib import Path
import pandas as pd

from intelligence_service.services.predictor import BehavioralPredictor


# ============================================================
# PATH CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "Mouse-Dynamics-Challenge-master"
)

TEST_FOLDER = DATASET_PATH / "test_files"


# ============================================================
# FIND A REAL BALABIT TEST SESSION
# ============================================================

def find_test_session():

    if not TEST_FOLDER.exists():
        raise FileNotFoundError(
            f"Test folder not found: {TEST_FOLDER}"
        )

    user_folders = sorted(
        [
            folder
            for folder in TEST_FOLDER.iterdir()
            if folder.is_dir()
        ]
    )

    if not user_folders:
        raise RuntimeError(
            "No users found inside test_files."
        )

    for user_folder in user_folders:

        session_files = sorted(
            [
                file
                for file in user_folder.iterdir()
                if file.is_file()
            ]
        )

        if session_files:
            return user_folder.name, session_files[0]

    raise RuntimeError(
        "No session files found."
    )


# ============================================================
# CONVERT BALABIT SESSION → EVOGUARD EVENTS
# ============================================================

def load_balabit_events(session_file):

    dataframe = pd.read_csv(
        session_file
    )

    dataframe.columns = [
        column.strip()
        for column in dataframe.columns
    ]

    required_columns = {
        "client timestamp",
        "state",
        "x",
        "y"
    }

    missing_columns = (
        required_columns
        - set(dataframe.columns)
    )

    if missing_columns:

        raise ValueError(
            "Missing required columns: "
            + ", ".join(missing_columns)
        )

    events = []

    for _, row in dataframe.iterrows():

        state = str(
            row["state"]
        ).strip().lower()

        # --------------------------------------------
        # BALABIT → BROWSER EVENT MAPPING
        # --------------------------------------------

        if state in (
            "move",
            "drag"
        ):

            event_type = "mousemove"

        elif state == "pressed":

            event_type = "mousedown"

        elif state == "released":

            event_type = "mouseup"

        else:
            continue

        # --------------------------------------------
        # TIMESTAMP
        # --------------------------------------------

        timestamp = row[
            "client timestamp"
        ]

        if pd.isna(timestamp):
            continue

        # --------------------------------------------
        # COORDINATES
        # --------------------------------------------

        x = row["x"]
        y = row["y"]

        if pd.isna(x):
            x = None

        if pd.isna(y):
            y = None

        events.append({

            "type":
                event_type,

            "timestamp":
                float(timestamp),

            "x":
                None
                if x is None
                else float(x),

            "y":
                None
                if y is None
                else float(y)
        })

    if not events:

        raise ValueError(
            "No valid behavioral events "
            "were generated from the session."
        )

    return events


# ============================================================
# REAL SESSION VALIDATION
# ============================================================

def main():

    print("=" * 70)

    print(
        "PHASE 6 — REAL SESSION VALIDATION"
    )

    print("=" * 70)

    # --------------------------------------------------------
    # STEP 1 — SELECT SESSION
    # --------------------------------------------------------

    actual_user, session_file = (
        find_test_session()
    )

    print(
        f"\nActual User       : {actual_user}"
    )

    print(
        f"Session File      : {session_file.name}"
    )

    print(
        f"Session Path      : {session_file}"
    )

    # --------------------------------------------------------
    # STEP 2 — LOAD EVENTS
    # --------------------------------------------------------

    print(
        "\nConverting Balabit session "
        "to EvoGuard events..."
    )

    events = load_balabit_events(
        session_file
    )

    print(
        f"Events Loaded     : {len(events)}"
    )

    # --------------------------------------------------------
    # STEP 3 — INITIALIZE EXISTING PREDICTOR
    # --------------------------------------------------------

    print(
        "\nLoading Behavioral "
        "Intelligence pipeline..."
    )

    predictor = BehavioralPredictor()

    # --------------------------------------------------------
    # STEP 4 — RUN EXISTING PIPELINE
    # --------------------------------------------------------

    result = (
        predictor.predict_from_events(
            events
        )
    )

    # --------------------------------------------------------
    # STEP 5 — DISPLAY RESULT
    # --------------------------------------------------------

    predicted_user = result.get(
        "prediction"
    )

    confidence = result.get(
        "confidence"
    )

    risk_score = result.get(
        "risk_score"
    )

    risk_status = result.get(
        "risk_status"
    )

    features_generated = result.get(
        "features_generated"
    )

    print(
        "\n" + "=" * 70
    )

    print(
        "BEHAVIORAL INTELLIGENCE RESULT"
    )

    print(
        "=" * 70
    )

    print(
        f"\nActual User       : {actual_user}"
    )

    print(
        f"Predicted User    : {predicted_user}"
    )

    print(
        f"Confidence        : "
        f"{confidence:.4f}"
        if isinstance(
            confidence,
            (int, float)
        )
        else
        f"Confidence        : {confidence}"
    )

    print(
        f"Risk Score        : {risk_score}"
    )

    print(
        f"Risk Status       : {risk_status}"
    )

    print(
        f"Features Generated: "
        f"{features_generated}"
    )

    # --------------------------------------------------------
    # STEP 6 — MATCH CHECK
    # --------------------------------------------------------

    if str(predicted_user) == str(
        actual_user
    ):

        print(
            "\nIdentity Match    : CORRECT"
        )

    else:

        print(
            "\nIdentity Match    : INCORRECT"
        )

    print(
        "\n" + "=" * 70
    )

    print(
        "REAL SESSION VALIDATION SUCCESS"
    )

    print(
        "=" * 70
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()