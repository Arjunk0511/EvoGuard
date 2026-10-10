# training/check_dataset.py

import pandas as pd

df = pd.read_csv("../dataset/combined.csv")

print(df.shape)

print(df["Label"].value_counts())