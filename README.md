# AI Agent State Reconciliation Platform

An enterprise-grade, deterministic AI agent state reconciliation platform built with Node.js, Express.js, MongoDB, and Python. The system ingests real-time and offline asynchronous interaction logs, reconstructs agent states across time, resolves identity ambiguities via inter-process communication (IPC) with Python, and provides replayable decisions alongside comprehensive audit logs.

---

## 🛠️ Tech Stack & Architecture

* **Backend Framework:** Node.js, Express.js
* **Database:** MongoDB (Mongoose ODM)
* **Identity Resolution Engine:** Python 3 (IPC via STDIO stream JSON exchange)
* **Testing Suite:** Jest, Supertest
* **Frontend Visualization (Bonus):** React.js

---

## 🚀 Quick Start Guide (Clone → Setup → Run → Test)

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v16+)
* [Python 3](https://www.python.org/) (v3.8+)
* [MongoDB](https://www.mongodb.com/try/download/community) running locally on `mongodb://127.0.0.1:27017`

---

### 2. Clone the Repository
```bash
git clone [https://github.com/anshu-man-6/AI-Agent-State-Reconciliation-with-Temporal-Evidence-and-Identity-Resolution.git](https://github.com/anshu-man-6/AI-Agent-State-Reconciliation-with-Temporal-Evidence-and-Identity-Resolution.git)
cd AI-Agent-State-Reconciliation-with-Temporal-Evidence-and-Identity-Resolution



Installation
Install Node.js dependencies for the root server:npm install

Optional) Install React frontend dependencies if running the UI:
cd client
npm install



Running the Server
Start the Node.js / Express backend server:
npm start



Running Automated TestsRun the complete test suite covering all 5 edge cases, idempotency, deterministic replay, and Python IPC identity resolution: npm test
