# training/clean_dataset.py

import pandas as pd
import numpy as np

df = pd.read_csv("../dataset/combined.csv")

df.columns = df.columns.str.strip()

df.replace([np.inf, -np.inf], np.nan, inplace=True)

df.dropna(inplace=True)

df.drop_duplicates(inplace=True)

print(df.shape)

df.to_csv(
    "../dataset/cleaned.csv",
    index=False
)