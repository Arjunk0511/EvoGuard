# 🚀 EvoGuard – Intelligent Intrusion Detection System (IDS)

EvoGuard is a next-generation **Intrusion Detection System (IDS)** designed for web applications. It combines **behavioral analysis, risk-based detection, and cyber deception (honeypots)** to detect and respond to malicious activities in real time.

---

## 🧠 Project Overview

Traditional IDS solutions rely heavily on **static rules and known attack signatures**, making them ineffective against modern and evolving threats.

EvoGuard addresses these limitations by:

* Monitoring **every incoming request**
* Analyzing **user behavior (keystrokes, mouse movement)**
* Calculating a **dynamic risk score**
* Responding intelligently using **allow / rate-limit / deceive / block**

---

## 🧩 Key Features

### 🔍 Request Interception (IDS Core)

* Middleware-based interception using Express.js
* Captures:

  * IP address
  * Endpoint
  * Request method
  * Timestamp

---

### 📊 Risk Scoring Engine

* Multi-factor risk calculation based on:

  * Request frequency (rate limiting)
  * Behavioral patterns
  * Request anomalies

---

### 🧬 Behavioral Analysis

* Detects bots vs humans using:

  * Keystroke dynamics
  * Mouse movement patterns
* Focuses on **how users interact**, not what they input

---

### 🎭 Cyber Deception (Honeypot)

* High-risk users are redirected to a **mirror (fake) application**
* Captures attacker behavior without alerting them
* Improves threat intelligence

---

### 🔁 Self-Healing Security

* Automatically updates rules based on detected attack patterns
* Adapts to evolving threats

---

### 🔔 Alert System

* Notifies administrators of high-risk activities
* Supports integration with tools like Telegram / Discord

---

## 🏗️ System Architecture

```text
User Request
     ↓
IDS Middleware (Express)
     ↓
Logging (MongoDB)
     ↓
Risk Scoring Engine
     ↓
Decision Engine
   ↙       ↓        ↘
Allow   Rate Limit   Redirect (Honeypot)
                          ↓
                Attacker Behavior Logging
                          ↓
                Adaptive Rule Engine
```

---

## ⚙️ Tech Stack

### Frontend

* React.js

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Optional AI Module

* Python (Flask / FastAPI)

---

## 🚀 Implementation Phases

1. **Basic Web Application**

   * Login, Dashboard, API routes

2. **IDS Middleware**

   * Intercept and log all requests

3. **Logging System**

   * Store request data in MongoDB

4. **Rate Limiting**

   * Detect brute force and flooding attacks

5. **Risk Scoring**

   * Combine multiple signals

6. **Honeypot (Mirror Site)**

   * Redirect suspicious users

7. **Behavioral Analysis**

   * Capture and analyze user interactions

8. **AI Integration (Optional)**

   * Enhance detection accuracy

9. **Self-Healing & Alerts**

   * Adaptive rules + notifications

---

## 🛡️ Attacks Detected

* Brute Force Attacks
* Credential Stuffing
* Bot / Automated Attacks
* Application-layer DDoS
* Reconnaissance / Scanning
* Suspicious Behavioral Activity

---

## ⚠️ Limitations

* Cannot fully prevent large-scale distributed DDoS
* VPN/Tor users may mask real IP
* Behavioral analysis requires sufficient data
* Designed for moderate-scale deployment

---

## 🎯 Future Enhancements

* Deep learning-based behavior models
* Integration with SIEM systems
* Real-time cloud deployment
* LLM-based threat analysis

---

## 📄 Research Contribution

This project proposes an integrated approach combining:

* Intrusion Detection Systems (IDS)
* Behavioral Biometrics
* Cyber Deception (Honeypots)
* Adaptive Self-Healing Mechanisms

---

## 🤝 Contributors

* Arjun Krishnan
* Piyush Sharma
* Soumyaranjan Maharana
* Shalmali Thombre

---

## 📜 License

This project is developed for academic and research purposes.

---

## ⭐ Final Note

EvoGuard is not just a detection system — it is an **intelligent security framework** that adapts, learns, and deceives attackers to enhance web application security.
