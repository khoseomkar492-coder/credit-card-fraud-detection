import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import "./App.css";

const featureNames = Array.from({ length: 28 }, (_, i) => `V${i + 1}`);

const initialForm = {
  Time: 1000,
  Amount: 100,
  ...Object.fromEntries(featureNames.map((name) => [name, 0])),
};

function App() {
  const [token, setToken] = useState(
    sessionStorage.getItem("access_token") || "",
  );
  const [authMode, setAuthMode] = useState("login");
  const [resetToken, setResetToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const clearHistory = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/transactions", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to clear history");
      }

      setHistory([]);
      setError("");
    } catch (error) {
      console.error("Error clearing history:", error);
      setError("Unable to clear history. Please try again.");
    }
  };
  useEffect(() => {
    if (!token) {
      setHistory([]);
      return;
    }

    fetch("http://127.0.0.1:5000/api/transactions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load transaction history");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Transactions API response:", data);
        setHistory(
          Array.isArray(data)
            ? data
            : Array.isArray(data.transactions)
              ? data.transactions
              : [],
        );
      })
      .catch(() => setHistory([]));
  }, [token]);

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

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    const endpoint = authMode === "login" ? "/api/login" : "/api/register";

    try {
      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.msg || "Authentication failed");
      }

      if (authMode === "login") {
        sessionStorage.setItem("access_token", data.access_token);
        setToken(data.access_token);
        setPassword("");
      } else {
        setAuthMode("login");
        setPassword("");
        setError("Registration successful! Please log in.");
      }
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    }
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("The prediction service returned an error.");
      }

      const data = await response.json();
      setResult(data);

      const historyResponse = await fetch(
        "http://127.0.0.1:5000/api/transactions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!historyResponse.ok) {
        throw new Error("Failed to load transaction history");
      }

      const historyData = await historyResponse.json();
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setError(
        "Unable to connect to the Flask API. Make sure the backend is running on port 5000.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isFraud = result?.prediction === 1;
  const totalTransactions = history.length;

  const safeHistory = Array.isArray(history) ? history : [];
  const fraudDetectionRate =
    totalTransactions === 0
      ? 0
      : (
          (safeHistory.filter((transaction) => transaction.prediction === 1)
            .length /
            totalTransactions) *
          100
        ).toFixed(2);

  const chartData = [
    {
      name: "Legitimate",
      value: safeHistory.filter((transaction) => transaction.prediction === 0)
        .length,
    },
    {
      name: "Fraudulent",
      value: safeHistory.filter((transaction) => transaction.prediction === 1)
        .length,
    },
  ];

  const chartColors = ["#27d49b", "#ff6b6b"];

  const fraudTransactions = safeHistory.filter(
    (transaction) => transaction.prediction === 1,
  ).length;

  const safeTransactions = safeHistory.filter(
    (transaction) => transaction.prediction === 0,
  ).length;

  const averageFraudProbability =
    totalTransactions > 0
      ? (
          safeHistory.reduce(
            (sum, transaction) => sum + Number(transaction.probability ?? 0),
            0,
          ) / totalTransactions
        ).toFixed(2)
      : "0.00";

  return (
    <>
      {!token ? (
        <div className="auth-container">
          <h1>FraudShield</h1>
          <p>Credit Card Risk Intelligence</p>

          <h2>{authMode === "login" ? "Welcome Back" : "Create Account"}</h2>

          {authMode === "forgot" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                console.log("Forgot password form submitted");
                setError("");

                try {
                  const response = await fetch(
                    "http://127.0.0.1:5000/api/forgot-password",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ email: resetEmail }),
                    },
                  );

                  const data = await response.json();
                  console.log(
                    "Forgot password response:",
                    response.status,
                    data,
                  );

                  if (!response.ok) {
                    throw new Error(
                      data.error || "Password reset request failed.",
                    );
                  }

                  setResetToken(data.reset_token || "");
                  setError(
                    data.reset_token
                      ? "Reset token generated. Enter your new password below."
                      : data.message,
                  );
                } catch (err) {
                  setError(err.message || "Unable to request password reset.");
                }
              }}
            >
              <h2>Forgot Password?</h2>
              <input
                type="email"
                placeholder="Registered email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <button type="submit">Request Password Reset</button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                }}
              >
                Back to Login
              </button>
            </form>
          )}

          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password (minimum 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />

            <button type="submit">
              {authMode === "login" ? "Login" : "Register"}
            </button>
          </form>

          {/* {authMode === "login" && (
            <p className="forgot-password">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("forgot");
                  setError("");
                }}
              >
                Forgot Password?
              </button>
            </p>
          )} */}

          {authMode === "forgot" && resetToken && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");

                try {
                  const response = await fetch(
                    "http://127.0.0.1:5000/api/reset-password",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        token: resetToken,
                        new_password: newPassword,
                      }),
                    },
                  );

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(data.error || "Password reset failed.");
                  }

                  setError("Password reset successfully! You can now log in.");
                  setPassword("");
                  setNewPassword("");
                  setResetToken("");
                  setAuthMode("login");
                } catch (err) {
                  setError(err.message || "Unable to reset password.");
                }
              }}
            >
              <h2>Set New Password</h2>
              <input
                type="password"
                placeholder="New password (minimum 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
              <button type="submit">Reset Password</button>
            </form>
          )}

          {error && <p>{error}</p>}

          <p>
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {authMode === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      ) : (
        <div className="app-shell">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">✓</div>
              <div>
                <div className="brand-name">FraudShield</div>
                <div className="brand-subtitle">
                  Credit Card Risk Intelligence
                </div>
              </div>
            </div>

            <div className="api-status">
              <span className="status-dot" />
              ML API
              <span className="status-text">Ready</span>
              <button
                className="logout-button"
                onClick={() => {
                  sessionStorage.removeItem("access_token");
                  setToken("");
                  setHistory([]);
                  setResult(null);
                  setError("");
                  setAuthMode("login");
                }}
              >
                Logout
              </button>
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
                  Submit transaction features to your trained Random Forest
                  model and receive an instant fraud-risk classification.
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
                    dataset. For a real transaction, these values should come
                    from the same preprocessing pipeline used during training.
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

                <button
                  type="button"
                  className="demo-button"
                  onClick={useDemo}
                  disabled={loading}
                >
                  Load Demo Sample
                </button>

                <button
                  className="predict-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Analyzing transaction..."
                    : "Analyze transaction →"}
                </button>

                {error && <div className="error-box">{error}</div>}
              </form>

              <aside
                className={`card result-card ${result ? "has-result" : ""}`}
              >
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
                      Enter the transaction details and click Analyze
                      transaction to run the Random Forest model.
                    </p>
                  </div>
                ) : (
                  <div
                    className={`result-content ${
                      result.risk_level === "HIGH"
                        ? "fraud"
                        : result.risk_level === "MEDIUM"
                          ? "medium"
                          : "safe"
                    }`}
                  >
                    <div className="result-label">{result.risk_level} RISK</div>
                    <h3>{result.result}</h3>
                    <p>
                      Model classification:{" "}
                      <strong>Class {result.prediction}</strong>
                    </p>
                    <p>Fraud probability: {result.probability}%</p>
                    <p>Risk level: {result.risk_level}</p>
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

            <section className="stats-grid">
              <div className="card stat-card">
                <p>Total Transactions</p>
                <h2>{totalTransactions}</h2>
                <span>Latest records analyzed</span>
              </div>

              <div className="card stat-card">
                <p>Fraud Detected</p>
                <h2>{fraudTransactions}</h2>
                <span>Classified as fraudulent</span>
              </div>

              <div className="card stat-card">
                <p>Safe Transactions</p>
                <h2>{safeTransactions}</h2>
                <span>Classified as legitimate</span>
              </div>

              <div className="card stat-card">
                <p>Average Fraud Probability</p>
                <h2>{averageFraudProbability}%</h2>
                <span>Across loaded history</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Fraud Detection Rate</span>
                <h3>{fraudDetectionRate}%</h3>
                <p>Transactions flagged as fraudulent</p>
              </div>
            </section>

            <section className="analytics-card card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">MODEL ANALYTICS</span>
                  <h2>Transaction Overview</h2>
                  <p>
                    Legitimate and fraudulent predictions in recent history.
                  </p>
                </div>
              </div>

              {totalTransactions === 0 ? (
                <div className="history-empty">
                  Analyze a transaction to see the chart.
                </div>
              ) : (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        label={({ name, value }) => {
                          const percentage =
                            totalTransactions === 0
                              ? 0
                              : ((value / totalTransactions) * 100).toFixed(1);

                          return `${name}: ${value} (${percentage}%)`;
                        }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171a2b",
                          border: "1px solid #292d43",
                          borderRadius: "10px",
                          color: "#f5f6ff",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="history-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">TRANSACTION LOG</span>
                  <h2>Prediction History</h2>
                  <p>
                    Latest transactions analyzed by the fraud detection system.
                  </p>
                </div>
                <div className="history-actions">
                  <span className="history-count">
                    {history.length} records
                  </span>

                  <button
                    className="clear-history-btn"
                    onClick={clearHistory}
                    disabled={history.length === 0}
                  >
                    Clear History
                  </button>
                </div>
              </div>
              <div className="history-table">
                <div className="history-row history-header">
                  <span>Time</span>
                  <span>Amount</span>
                  <span>Prediction</span>
                  <span>Result</span>
                  <span>Fraud Probability</span>
                  <span>Risk Level</span>
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

                      <span>{transaction.result || "N/A"}</span>
                      <span>
                        {transaction.probability != null
                          ? `${transaction.probability}%`
                          : "N/A"}
                      </span>

                      <span
                        className={
                          transaction.risk_level === "HIGH"
                            ? "history-fraud"
                            : transaction.risk_level === "MEDIUM"
                              ? "history-medium"
                              : "history-safe"
                        }
                      >
                        {transaction.risk_level || "N/A"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="info-strip">
              <div className="project-info">
                <span className="info-icon">✦</span>
                <div>
                  <strong>About FraudShield</strong>
                  <p>
                    An ML-powered system that analyzes transaction patterns to
                    identify potentially fraudulent credit-card activity.
                  </p>
                </div>
              </div>

              <div className="metric">
                <span className="metric-label">Fraud Precision</span>
                <strong>95%</strong>
                <span className="metric-description">
                  Fraud alerts that were correct
                </span>
              </div>

              <div className="metric">
                <span className="metric-label">Fraud Recall</span>
                <strong>73%</strong>
                <span className="metric-description">
                  Fraud cases detected in testing
                </span>
              </div>
            </section>
          </main>
        </div>
      )}
    </>
  );
}
export default App;
