import pandas as pd

# Load dataset
df = pd.read_csv("data/creditcard.csv")

# Remove duplicate rows
df = df.drop_duplicates()

# Save cleaned dataset
df.to_csv("data/creditcard_cleaned.csv", index=False)

print("Cleaned dataset saved successfully!")
print("Dataset shape:", df.shape)