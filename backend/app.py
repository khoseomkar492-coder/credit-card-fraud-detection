from flask import Flask, jsonify, request
from pymongo import MongoClient

app = Flask(__name__)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")

# Select database
db = client["fraud_detection"]

# Select collection
transactions_collection = db["transactions"]


@app.route("/")
def home():
    return "Credit Card Fraud Detection API is running!"


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.json

    transactions_collection.insert_one(data)

    return jsonify({
        "message": "Transaction added successfully"
    }), 201


if __name__ == "__main__":
    app.run(debug=True)