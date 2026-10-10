import pandas as pd
import glob

files = glob.glob("../dataset/*.csv")

dfs = []

for file in files:
    df = pd.read_csv(file)
    dfs.append(df)

data = pd.concat(dfs, ignore_index=True)

print(data.shape)

data.to_csv(
    "../dataset/combined.csv",
    index=False
)