import { useEffect, useState } from "react";
import "./App.css";

const featureNames = Array.from({ length: 28 }, (_, i) => `V${i + 1}`);

const initialForm = {
  Time: 1000,
  Amount: 100,
  ...Object.fromEntries(featureNames.map((name) => [name, 0])),
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/transactions")
      .then((response) => response.json())
      .then((data) => setHistory(data))
      .catch(() => setHistory([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setResult(null);
    setError("");
  };

  const useDemo = (type) => {
    if (type === "legitimate") {
      setForm({
        Time: 1000,
        Amount: 100,
        ...Object.fromEntries(featureNames.map((name) => [name, 0])),
      });
    } else {
      setForm({
        Time: 406,
        V1: -2.3122265423263,
        V2: 1.95199201064158,
        V3: -1.60985073229769,
        V4: 3.9979055875468,
        V5: -0.522187864667764,
        V6: -1.42654531920595,
        V7: -2.53738730624579,
        V8: 1.39165724829804,
        V9: -2.77008927719433,
        V10: -2.77227214465915,
        V11: 3.20203320709635,
        V12: -2.89990738849473,
        V13: -0.595221881324605,
        V14: -4.28925378244217,
        V15: 0.389724120274487,
        V16: -1.14074717980657,
        V17: -2.83005567450437,
        V18: -0.0168224681808257,
        V19: 0.416955705037907,
        V20: 0.126910559061474,
        V21: 0.517232370861764,
        V22: -0.0350493686052974,
        V23: -0.465211076182388,
        V24: 0.320198198514526,
        V25: 0.0445191674731724,
        V26: 0.177839798284401,
        V27: 0.261145002567677,
        V28: -0.143275874698919,
        Amount: 0.0,
      });
    }
    setResult(null);
    setError("");
  };

  const checkTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, Number(value)]),
    );

    try {
      const response = await fetch("http://127.0.0.1:5000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("The prediction service returned an error.");
      }

      const data = await response.json();
      setResult(data);

      const historyResponse = await fetch(
        "http://127.0.0.1:5000/api/transactions",
      );
      const historyData = await historyResponse.json();
      setHistory(historyData);
    } catch (err) {
      setError(
        "Unable to connect to the Flask API. Make sure the backend is running on port 5000.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isFraud = result?.prediction === 1;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">✓</div>
          <div>
            <div className="brand-name">FraudShield</div>
            <div className="brand-subtitle">Credit Card Risk Intelligence</div>
          </div>
        </div>

        <div className="api-status">
          <span className="status-dot" />
          ML API
          <span className="status-text">Ready</span>
        </div>
      </header>

      <main className="dashboard">
        <section className="hero">
          <div>
            <p className="eyebrow">REAL-TIME TRANSACTION ANALYSIS</p>
            <h1>
              Detect suspicious transactions before they become a problem.
            </h1>
            <p className="hero-copy">
              Submit transaction features to your trained Random Forest model
              and receive an instant fraud-risk classification.
            </p>
          </div>

          <div className="model-badge">
            <span>MODEL</span>
            <strong>Random Forest</strong>
            <small>F1 score 0.82</small>
          </div>
        </section>

        <section className="content-grid">
          <form className="card form-card" onSubmit={checkTransaction}>
            <div className="card-heading">
              <div>
                <p className="section-kicker">TRANSACTION INPUT</p>
                <h2>Check a transaction</h2>
              </div>
              <div className="shield-icon">⌁</div>
            </div>

            <div className="demo-row">
              <span>Quick demo</span>
              <button type="button" onClick={() => useDemo("legitimate")}>
                Legitimate sample
              </button>
              <button type="button" onClick={() => useDemo("fraud")}>
                Fraud sample
              </button>
            </div>

            <div className="main-fields">
              <label>
                Transaction time
                <input
                  name="Time"
                  type="number"
                  value={form.Time}
                  onChange={handleChange}
                  required
                />
                <span>Seconds elapsed from the first transaction</span>
              </label>

              <label>
                Transaction amount
                <div className="input-with-prefix">
                  <span>$</span>
                  <input
                    name="Amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.Amount}
                    onChange={handleChange}
                    required
                  />
                </div>
                <span>Amount used by the training dataset</span>
              </label>
            </div>

            <details className="advanced">
              <summary>
                <span>Advanced anonymized features</span>
                <small>V1–V28</small>
              </summary>

              <p className="advanced-note">
                V1–V28 are anonymized PCA-derived features from the Kaggle
                dataset. For a real transaction, these values should come from
                the same preprocessing pipeline used during training.
              </p>

              <div className="feature-grid">
                {featureNames.map((name) => (
                  <label key={name}>
                    {name}
                    <input
                      name={name}
                      type="number"
                      step="any"
                      value={form[name]}
                      onChange={handleChange}
                    />
                  </label>
                ))}
              </div>
            </details>

            <button className="predict-button" type="submit" disabled={loading}>
              {loading ? "Analyzing transaction..." : "Analyze transaction →"}
            </button>

            {error && <div className="error-box">{error}</div>}
          </form>

          <aside className={`card result-card ${result ? "has-result" : ""}`}>
            <div className="result-top">
              <div>
                <p className="section-kicker">ANALYSIS RESULT</p>
                <h2>Transaction status</h2>
              </div>
              <div className="result-icon">
                {result ? (isFraud ? "!" : "✓") : "?"}
              </div>
            </div>

            {!result ? (
              <div className="empty-result">
                <div className="scan-ring">⌁</div>
                <h3>Waiting for analysis</h3>
                <p>
                  Enter the transaction details and click Analyze transaction to
                  run the Random Forest model.
                </p>
              </div>
            ) : (
              <div className={`result-content ${isFraud ? "fraud" : "safe"}`}>
                <div className="result-label">
                  {isFraud ? "HIGH RISK" : "LOW RISK"}
                </div>
                <h3>{result.result}</h3>
                <p>
                  Model classification:{" "}
                  <strong>Class {result.prediction}</strong>
                </p>
                <p>Fraud probability: {result.probability}%</p>
                <div className="probability-bar">
                  <div
                    className="probability-fill"
                    style={{ width: `${result.probability}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="result-footer">
              <div>
                <span>Model</span>
                <strong>Random Forest</strong>
              </div>
              <div>
                <span>Database</span>
                <strong>MongoDB</strong>
              </div>
              <div>
                <span>API</span>
                <strong>Flask</strong>
              </div>
            </div>
          </aside>
        </section>

        <section className="history-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TRANSACTION LOG</span>
              <h2>Prediction History</h2>
              <p>Latest transactions analyzed by the fraud detection system.</p>
            </div>
            <span className="history-count">{history.length} records</span>
          </div>

          <div className="history-table">
            <div className="history-row history-header">
              <span>Time</span>
              <span>Amount</span>
              <span>Prediction</span>
              <span>Result</span>
            </div>

            {history.length === 0 ? (
              <div className="history-empty">
                No transaction history available.
              </div>
            ) : (
              history.map((transaction, index) => (
                <div className="history-row" key={index}>
                  <span>{transaction.Time}</span>
                  <span>${Number(transaction.Amount).toFixed(2)}</span>
                  <span>
                    <strong
                      className={
                        transaction.prediction === 1
                          ? "history-fraud"
                          : "history-safe"
                      }
                    >
                      Class {transaction.prediction}
                    </strong>
                  </span>
                  <span>{transaction.result}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="info-strip">
          <div>
            <span className="info-icon">i</span>
            <div>
              <strong>About this project</strong>
              <p>
                This application uses supervised machine learning to classify
                credit-card transactions as legitimate or fraudulent.
              </p>
            </div>
          </div>
          <div className="metric">
            <strong>0.95</strong>
            <span>Fraud precision</span>
          </div>
          <div className="metric">
            <strong>0.73</strong>
            <span>Fraud recall</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
