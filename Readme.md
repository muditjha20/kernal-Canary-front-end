# Kernel Canary++ 🛡️  
**Real-time System Log Anomaly Detector** powered by regex fingerprinting and vectorized inference.

Kernel Canary++ is a lightweight web tool that identifies anomalies in low-level system logs using a trained ML backend. Designed for ops engineers, researchers, and security teams, it allows quick log inspection without raw model access.

## 🚀 Features

- ⚡ **Real-Time Detection**: Paste log lines and get instant feedback via a hosted anomaly scoring API.
- 🧠 **Regex-based Event Parsing**: Uses a handcrafted EventId → regex mapping to extract semantic patterns from raw logs.
- 📊 **Vectorized Input**: Converts logs into fixed-length frequency vectors, preserving system behavior signatures.
- 🧪 **Toggleable Samples**: Built-in sample logs to simulate both normal and abnormal scenarios.
- 🌐 **Deployed UI**: Frontend fully hosted — no setup needed to test.

## 🧠 How It Works

1. Each log line is matched against a library of known regex templates (from `templates.json`) to assign an `EventId`.
2. A frequency vector is built using the order defined in `event_order.json`.
3. This vector is POSTed to a hosted anomaly detection backend (`/score` endpoint).
4. The backend returns a classification:  
   `✅ Normal` or `❗ Anomaly`.

## 🌍 Live Demo

**Frontend**: [https://kernal-canary.onrender.com](https://kernal-canary.onrender.com)

> Paste your own logs or try built-in examples. Works in any modern browser.

## 📦 Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Parsing Engine**: Regex rule-matching via `templates.json`
- **Backend (external)**: Trained ML model (Isolation Forest), hosted on Render
- **Artifacts**: `event_order.json`, `templates.json` for interpretability and portability

## 📈 Impact

- ✅ Handles complex Hadoop-style logs with flexible slicing and matching
- 🔍 Abstracts low-level noise into high-level behavioral signatures
- ⏱️ Scoring latency <1s per log window (measured via deployed API)
- 🔒 No sensitive data stored — ephemeral log processing only

## 👨‍💻 Author

**Mudit Mayank Jha**  
B.Sc. Computer Science
[GitHub](https://github.com/muditjha20)

