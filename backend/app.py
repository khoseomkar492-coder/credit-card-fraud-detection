from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")

# Select database
db = client["fraud_detection"]

# Select collection
transactions_collection = db["transactions"]

# Load trained Random Forest model
model = joblib.load("../ml/random_forest_model.joblib")


@app.route("/")
def home():
    return "Credit Card Fraud Detection API is running!"


@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.json

    # Create DataFrame with the same feature names
    # used while training the Random Forest model
    features = pd.DataFrame([{
        "Time": data["Time"],
        "V1": data["V1"],
        "V2": data["V2"],
        "V3": data["V3"],
        "V4": data["V4"],
        "V5": data["V5"],
        "V6": data["V6"],
        "V7": data["V7"],
        "V8": data["V8"],
        "V9": data["V9"],
        "V10": data["V10"],
        "V11": data["V11"],
        "V12": data["V12"],
        "V13": data["V13"],
        "V14": data["V14"],
        "V15": data["V15"],
        "V16": data["V16"],
        "V17": data["V17"],
        "V18": data["V18"],
        "V19": data["V19"],
        "V20": data["V20"],
        "V21": data["V21"],
        "V22": data["V22"],
        "V23": data["V23"],
        "V24": data["V24"],
        "V25": data["V25"],
        "V26": data["V26"],
        "V27": data["V27"],
        "V28": data["V28"],
        "Amount": data["Amount"]
    }])

    # Make prediction
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]

    if probability >= 0.7:
        risk_level = "HIGH"
    elif probability >= 0.3:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    if prediction == 1:
        result = "Fraudulent Transaction"
    else:
        result = "Legitimate Transaction"

    # Save transaction and prediction in MongoDB
    transaction = data.copy()
    transaction["prediction"] = int(prediction)
    transaction["result"] = result

    transactions_collection.insert_one(transaction)

    return jsonify({
    "prediction": int(prediction),
    "result": result,
    "probability": round(float(probability) * 100, 2),
    "risk_level": risk_level
})


@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    transactions = list(
        transactions_collection.find(
            {},
            {"_id": 0}
        ).sort("_id", -1).limit(20)
    )

    return jsonify(transactions)


if __name__ == "__main__":
    app.run(debug=True)