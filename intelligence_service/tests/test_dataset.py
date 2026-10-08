import os

# ============================================================
# PHASE 6 — DATASET VALIDATION
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        ".."
    )
)

DATASET_PATH = os.path.join(
    PROJECT_ROOT,
    "datasets",
    "Mouse-Dynamics-Challenge-master"
)

TRAIN_PATH = os.path.join(
    DATASET_PATH,
    "training_files"
)

TEST_PATH = os.path.join(
    DATASET_PATH,
    "test_files"
)

print("=" * 70)
print("PHASE 6 — DATASET VALIDATION")
print("=" * 70)

print("\nDataset path:")
print(DATASET_PATH)

# ------------------------------------------------------------
# Check dataset
# ------------------------------------------------------------

if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(
        f"Dataset not found:\n{DATASET_PATH}"
    )

print("\nDataset found successfully.")

# ------------------------------------------------------------
# Check training and testing folders
# ------------------------------------------------------------

if not os.path.exists(TRAIN_PATH):
    raise FileNotFoundError(
        f"Training folder not found:\n{TRAIN_PATH}"
    )

if not os.path.exists(TEST_PATH):
    raise FileNotFoundError(
        f"Test folder not found:\n{TEST_PATH}"
    )

print("Training folder: OK")
print("Testing folder : OK")

# ------------------------------------------------------------
# List users
# ------------------------------------------------------------

train_users = sorted([
    name
    for name in os.listdir(TRAIN_PATH)
    if os.path.isdir(
        os.path.join(TRAIN_PATH, name)
    )
])

test_users = sorted([
    name
    for name in os.listdir(TEST_PATH)
    if os.path.isdir(
        os.path.join(TEST_PATH, name)
    )
])

print("\nTraining users:")
print(train_users)

print("\nTesting users:")
print(test_users)

print("\nNumber of training users:", len(train_users))
print("Number of testing users :", len(test_users))

# ------------------------------------------------------------
# Check sessions
# ------------------------------------------------------------

print("\nSessions per training user:")

for user in train_users:
    user_path = os.path.join(
        TRAIN_PATH,
        user
    )

    sessions = [
        f
        for f in os.listdir(user_path)
        if os.path.isfile(
            os.path.join(user_path, f)
        )
    ]

    print(
        f"{user}: {len(sessions)} sessions"
    )

print("\n" + "=" * 70)
print("DATASET VALIDATION SUCCESS")
print("=" * 70)