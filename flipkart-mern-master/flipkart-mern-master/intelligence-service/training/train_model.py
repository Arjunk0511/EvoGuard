import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

df = pd.read_csv("../dataset/evoguard_dataset.csv")

scaler = StandardScaler()

X_scaled = scaler.fit_transform(df)

model = IsolationForest(
    contamination=0.1,
    random_state=42
)

model.fit(X_scaled)

joblib.dump(
    model,
    "../model/isolation_forest.pkl"
)

joblib.dump(
    scaler,
    "../model/scaler.pkl"
)

print("Model Training Complete")
