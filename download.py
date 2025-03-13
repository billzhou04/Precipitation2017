import pandas as pd
import os

# Load the weather dataset
df = pd.read_csv("./data/weather.csv")

# Convert date column to datetime
df["date"] = pd.to_datetime(df["date"], format="%Y%m%d")

# Filter for 2017
df_2017 = df[df["date"].dt.year == 2017]

# Extract month
df_2017["month"] = df_2017["date"].dt.month

# Compute monthly averages per state for both wind speed and precipitation
df_avg = df_2017.groupby(["state", "month"])[["WSF5", "PRCP"]].max().reset_index()

# Save the processed data
output_file = os.path.join("./data", "wind_prcp_2017.csv")
df_avg.to_csv(output_file, index=False)


