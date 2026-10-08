import pandas as pd
import joblib

# Load the trained model
model = joblib.load("ml/random_forest_model.joblib")

# Load the cleaned dataset
df = pd.read_csv("data/creditcard_cleaned.csv")

# Separate features and target
X = df.drop("Class", axis=1)
y = df["Class"]

# Find one actual fraud transaction
fraud_index = y[y == 1].index[0]

# Get the fraud transaction
sample = X.loc[[fraud_index]]

# Make prediction
prediction = model.predict(sample)

if prediction[0] == 1:
    print("Prediction: Fraudulent Transaction")
else:
    print("Prediction: Legitimate Transaction")

print("Actual Class:", y.loc[fraud_index])