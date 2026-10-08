from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import joblib

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

    # Convert input data into the format required by the model
    features = [[
        data["Time"],
        data["V1"],
        data["V2"],
        data["V3"],
        data["V4"],
        data["V5"],
        data["V6"],
        data["V7"],
        data["V8"],
        data["V9"],
        data["V10"],
        data["V11"],
        data["V12"],
        data["V13"],
        data["V14"],
        data["V15"],
        data["V16"],
        data["V17"],
        data["V18"],
        data["V19"],
        data["V20"],
        data["V21"],
        data["V22"],
        data["V23"],
        data["V24"],
        data["V25"],
        data["V26"],
        data["V27"],
        data["V28"],
        data["Amount"]
    ]]

    prediction = model.predict(features)[0]

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
        "result": result
    })


if __name__ == "__main__":
    app.run(debug=True)