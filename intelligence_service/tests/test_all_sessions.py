from pathlib import Path
from collections import Counter, defaultdict

from intelligence_service.services.predictor import BehavioralPredictor
from intelligence_service.tests.test_real_session import load_balabit_events


PROJECT_ROOT = Path(__file__).resolve().parents[2]

TEST_FOLDER = (
    PROJECT_ROOT
    / "datasets"
    / "Mouse-Dynamics-Challenge-master"
    / "test_files"
)


def main():

    print("=" * 70)
    print("PHASE 6 — MULTI-SESSION VALIDATION")
    print("=" * 70)

    if not TEST_FOLDER.exists():
        raise FileNotFoundError(
            f"Test folder not found: {TEST_FOLDER}"
        )

    predictor = BehavioralPredictor()

    total = 0
    correct = 0

    confidences = []
    risk_scores = []

    risk_distribution = Counter()

    user_total = defaultdict(int)
    user_correct = defaultdict(int)

    print("\nRunning real test sessions...\n")

    for user_folder in sorted(TEST_FOLDER.iterdir()):

        if not user_folder.is_dir():
            continue

        actual_user = user_folder.name

        for session_file in sorted(user_folder.iterdir()):

            if not session_file.is_file():
                continue

            try:

                events = load_balabit_events(
                    session_file
                )

                result = predictor.predict_from_events(
                    events
                )

                predicted_user = result["prediction"]
                confidence = result["confidence"]
                risk_score = result["risk_score"]
                risk_status = result["risk_status"]

                total += 1
                user_total[actual_user] += 1

                confidences.append(
                    float(confidence)
                )

                risk_scores.append(
                    float(risk_score)
                )

                risk_distribution[
                    risk_status
                ] += 1

                is_correct = (
                    str(predicted_user)
                    == str(actual_user)
                )

                if is_correct:
                    correct += 1
                    user_correct[actual_user] += 1

                match_text = (
                    "CORRECT"
                    if is_correct
                    else "INCORRECT"
                )

                print(
                    f"{actual_user:<8} | "
                    f"{session_file.name:<22} | "
                    f"Pred: {str(predicted_user):<8} | "
                    f"Conf: {float(confidence):.4f} | "
                    f"Risk: {float(risk_score):6.2f} | "
                    f"{risk_status:<8} | "
                    f"{match_text}"
                )

            except Exception as error:

                print(
                    f"[ERROR] {actual_user} / "
                    f"{session_file.name}: {error}"
                )

    if total == 0:
        raise RuntimeError(
            "No test sessions were successfully processed."
        )

    accuracy = (
        correct / total
    ) * 100

    average_confidence = (
        sum(confidences)
        / len(confidences)
    )

    average_risk = (
        sum(risk_scores)
        / len(risk_scores)
    )

    print("\n" + "=" * 70)
    print("OVERALL VALIDATION RESULTS")
    print("=" * 70)

    print(f"\nTotal Sessions     : {total}")
    print(f"Correct Predictions: {correct}")
    print(f"Incorrect          : {total - correct}")
    print(f"Accuracy           : {accuracy:.2f}%")
    print(f"Average Confidence : {average_confidence:.4f}")
    print(f"Average Risk Score : {average_risk:.2f}")

    print("\nRisk Distribution:")

    for status in [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
    ]:
        print(
            f"{status:<8}: "
            f"{risk_distribution[status]}"
        )

    print("\nPer-User Accuracy:")

    for user in sorted(user_total):

        total_user = user_total[user]
        correct_user = user_correct[user]

        user_accuracy = (
            correct_user / total_user
        ) * 100

        print(
            f"{user:<8}: "
            f"{correct_user}/{total_user} "
            f"({user_accuracy:.2f}%)"
        )

    print("\n" + "=" * 70)
    print("MULTI-SESSION VALIDATION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()