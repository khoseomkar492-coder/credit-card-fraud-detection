from flask import Flask, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from flask_cors import CORS
from pymongo import MongoClient
import joblib
import pandas as pd
import os
import secrets
from datetime import datetime, timezone
from dotenv import load_dotenv
import secrets

load_dotenv()

env_path = os.path.join(os.path.dirname(__file__), ".env")

if not os.getenv("JWT_SECRET_KEY"):
    secret_key = secrets.token_hex(32)
    with open(env_path, "a", encoding="utf-8") as env_file:
        env_file.write(f"\nJWT_SECRET_KEY={secret_key}\n")
    os.environ["JWT_SECRET_KEY"] = secret_key


app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]

jwt = JWTManager(app)
CORS(app)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")

# Select database
db = client["fraud_detection"]

# Select collection
transactions_collection = db["transactions"]
users_collection = db["users"]
password_resets_collection = db["password_resets"]
users_collection.create_index("email", unique=True)

# Load trained Random Forest model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "random_forest_model.joblib")

model = joblib.load(MODEL_PATH)

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    users_collection.insert_one({
        "email": email,
        "password_hash": generate_password_hash(password)
    })

    return jsonify({"message": "Registration successful"}), 201


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    user = users_collection.find_one({"email": email})

    # Use the same response whether the email exists or not.
    if not user:
        return jsonify({
            "message": "If the account exists, a reset link can be requested."
        }), 200

    token = secrets.token_urlsafe(32)

    password_resets_collection.insert_one({
        "email": email,
        "token": token,
        "expires_at": datetime.now(timezone.utc).timestamp() + 900,
        "used": False,
    })

    # Demo only: return the token so you can test the reset flow.
    return jsonify({
        "message": "Password reset requested.",
        "reset_token": token,
    }), 200


@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = data.get("token", "").strip()
    new_password = data.get("new_password", "")

    if not token or len(new_password) < 8:
        return jsonify({
            "error": "A reset token and password of at least 8 characters are required."
        }), 400

    reset_request = password_resets_collection.find_one({
        "token": token,
        "used": False,
    })

    if not reset_request:
        return jsonify({
            "error": "Invalid or already used reset token."
        }), 400

    if datetime.now(timezone.utc).timestamp() > reset_request["expires_at"]:
        return jsonify({
            "error": "Reset token has expired. Request a new one."
        }), 400

    result = users_collection.update_one(
        {"email": reset_request["email"]},
        {"$set": {"password": generate_password_hash(new_password)}},
    )

    if result.matched_count == 0:
        return jsonify({"error": "User account not found."}), 404

    password_resets_collection.update_one(
        {"_id": reset_request["_id"]},
        {"$set": {"used": True}},
    )

    return jsonify({"message": "Password reset successfully."}), 200


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = users_collection.find_one({"email": email})

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user["_id"]))

    return jsonify({
        "message": "Login successful",
        "email": user["email"],
     "access_token": access_token
    }), 200

@app.route("/")
def home():
    return "Credit Card Fraud Detection API is running!"


@app.route("/api/predict", methods=["POST"])
@jwt_required()
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
    transaction["user_id"] = get_jwt_identity()
    transaction["prediction"] = int(prediction)
    transaction["result"] = result
    transaction["probability"] = round(float(probability) * 100, 2)
    transaction["risk_level"] = risk_level

    transactions_collection.insert_one(transaction)

    return jsonify({
    "prediction": int(prediction),
    "result": result,
    "probability": round(float(probability) * 100, 2),
    "risk_level": risk_level
})


@app.route("/api/transactions", methods=["DELETE"])
@jwt_required()
def clear_transactions():
    transactions_collection.delete_many({
    "user_id": get_jwt_identity()
    })
    return jsonify({"message": "Transaction history cleared successfully"})


@app.route("/api/transactions", methods=["GET"])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()

    transactions = list(
        transactions_collection.find(
        {"user_id": user_id},
        {"_id": 0, "user_id": 0}
        ).sort("_id", -1).limit(20)
    )

    return jsonify(transactions)



if __name__ == "__main__":
   app.run(debug=False)