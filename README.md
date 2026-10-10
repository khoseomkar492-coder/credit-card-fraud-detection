FraudShield — Credit Card Fraud Detection

FraudShield is a machine learning project that detects potentially fraudulent credit card transactions using a Random Forest classifier. It includes a React frontend, Flask backend, and MongoDB database.

Features

Credit card fraud prediction

Fraud probability and risk-level display

Transaction history stored in MongoDB

Interactive dashboard and analytics

Model training on a new computer

Technology Stack

Frontend: React, Vite, Recharts

Backend: Python, Flask, Flask-CORS

Machine Learning: Pandas, Scikit-learn, Joblib

Database: MongoDB

Model: Random Forest Classifier

Requirements

Install the following software before starting:

Git

Python 3.11 or another compatible Python version

Node.js (LTS version) and npm

MongoDB Community Server

Check your installations:

git --version
python --version
node --version
npm --version

1. Clone the Repository

git clone https://github.com/khoseomkar492-coder/credit-card-fraud-detection.git
cd credit-card-fraud-detection

2. Extract the Dataset

The compressed dataset is stored in data/creditcard.zip.

From the project root, run this command in PowerShell:

Expand-Archive -Path .\data\creditcard.zip -DestinationPath .\data -Force

The extracted file should be:

data/creditcard.csv

3. Set Up the Machine Learning Environment

From the project root, run:

python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r ml/requirements.txt

If PowerShell blocks environment activation, use Command Prompt and run:

.venv\Scripts\activate.bat

4. Preprocess the Dataset

Run from the project root:

python ml/preprocess.py

This removes duplicate rows and creates:

data/creditcard_cleaned.csv

5. Train the Machine Learning Model

Run:

python ml/train_model.py

This trains a Random Forest classifier, displays its classification report, and saves the model to:

ml/random_forest_model.joblib

Training may take some time depending on your computer.

The trained model is not included in the repository; each user generates their own model by running this command.

6. Set Up MongoDB

Install MongoDB Community Server and ensure its database service is running.

FraudShield uses this local MongoDB connection:

mongodb://localhost:27017/

The backend creates or uses the fraud_detection database and its transactions collection when required.

You can verify the connection using MongoDB Shell:

mongosh

7. Set Up and Run the Backend

Open a new terminal at the project root:

cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py

The Flask backend should run at:

http://127.0.0.1:5000

Keep this terminal open.

8. Set Up and Run the Frontend

Open another terminal at the project root:

cd frontend
npm install
npm run dev

Open the local URL displayed by Vite, usually:

http://localhost:5173

Keep the frontend and backend terminals running while using the application.

Running the Project Again

After the initial setup, start MongoDB and run these three components in separate terminals.

Terminal 1 — Backend

cd backend
.\venv\Scripts\Activate.ps1
python app.py

Terminal 2 — Frontend

cd frontend
npm run dev

The trained model and preprocessed dataset should already exist. If they do not, activate the root .venv and run:

python ml/preprocess.py
python ml/train_model.py

Troubleshooting

Dataset not found: Confirm that data/creditcard.csv exists after extracting the ZIP.

Cleaned dataset missing: Run python ml/preprocess.py from the project root.

Model file missing: Run python ml/train_model.py from the project root.

MongoDB connection error: Ensure MongoDB Community Server is installed and running.

Python package errors: Activate the correct virtual environment and install its requirements.

Frontend cannot connect to the backend: Confirm that Flask is running at http://127.0.0.1:5000.

Frontend dependencies missing: Run npm install inside the frontend folder.

Dataset

This project uses the European credit card transaction dataset containing anonymized features and a transaction class label. The dataset is highly imbalanced, so precision, recall, and F1-score are important evaluation metrics alongside accuracy.

Disclaimer

FraudShield is an educational machine learning project. Predictions are not a guarantee that a transaction is fraudulent or legitimate and should not be used as the sole basis for real financial decisions.