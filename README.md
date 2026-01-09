# Strategic Business Simulation Engine
### Powered by F1 Intelligence Suite

## 1. Project Overview
The **Strategic Business Simulator** is a specialized module within the **F1 Intelligence Suite** designed to model the non-linear growth trajectories of SaaS businesses under uncertainty. 

Unlike traditional spreadsheet models, this engine approximates the "physics" of a business (Customer Acquisition Costs, LTV, Churn, Burn Multiples) and subjects them to stochastic shocks and strategic interventions. It leverages **Google's Gemini 2.0 Pro** for strategic reasoning, effectively acting as an "AI CFO" that can predict the 2nd and 3rd order effects of your decisions.

## 2. Core Architecture
The system is built on a **Hybrid Intelligence** framework that combines deterministic math with generative AI.

### A. The Simulation Core (Monte Carlo)
We do not predict one future; we map the cone of probability.
*   **Physics Layer**: Deterministic rules (e.g., *Ad Spend -> Traffic -> Leads*).
*   **Stochastic Layer**: Randomized noise applied to conversion rates and market conditions daily.
*   **Simulation**: Runs **50 parallel timelines** for 12 months to calculate:
    *   **P10 (Risk)**: The downside scenario (90% chance of beating this).
    *   **P50 (Median)**: The most likely outcome.
    *   **P90 (Upside)**: The best-case scenario.

### B. The 3 Orders of Effects
The engine evaluates every decision through three lenses:
1.  **First Order (Direct)**: The immediate accounting impact (e.g., "Cut Costs" -> "Burn decreases").
2.  **Second Order (Systemic)**: The feedback loops (e.g., "Cut Costs" -> "Product quality drops" -> "Churn increases").
3.  **Third Order (Emergent)**: The strategic ripple effects (e.g., "Competitors sense weakness and capture market share").
    *   *Powered by Gemini 2.0 or the Heuristic Engine.*

### C. Failsafe & Reliability
To ensure enterprise-grade reliability, the system features a **Smart Heuristic Failsafe**:
*   If the AI API is unavailable or quota-limited, the **Deterministic Logic Engine** takes over.
*   It analyzes variables like **Runway**, **LTV:CAC Ratio**, and **Cash Efficiency**.
*   It generates context-aware strategies (e.g., "Emergency Bridge Round" if runway < 6 months) without needing LLM inference.

## 3. Technology Stack
*   **Backend**: Python (FastAPI, NumPy, Pandas, Google Generative AI SDK).
*   **Frontend**: React.js (Vite, Recharts for visualization, TailwindCSS).
*   **AI**: Google Gemini 2.0 Flash / Pro.

## 4. Integration with F1 Intelligence Suite
This simulator serves as the **Predictive Layer** of the F1 Intelligence Suite. 
*   **Input**: It consumes historical data and current state vectors from the wider F1 ecosystem.
*   **Output**: It provides strategic decision nodes and risk probability clouds to the dashboard.

## 5. How to Run

### Prerequisites
*   Node.js & npm
*   Python 3.10+
*   Google Gemini API Key (Required for AI features)

### Quick Start (Recommended)

1. **Set up your API key:**
   ```bash
   echo "GOOGLE_API_KEY=your-api-key-here" > .env
   ```

2. **Run the application:**
   ```bash
   ./start.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

4. **Stop the application:**
   ```bash
   ./stop.sh
   ```

### Manual Setup (Alternative)

**Backend:**
```bash
pip install -r requirements.txt
python api.py
```

**Frontend:**
```bash
cd ui
npm install
npm run dev
```

### Features
- 🤖 **Real-time AI strategic analysis** using Gemini 2.0 Flash
- 📊 **Monte Carlo simulations** with probability distributions
- 🎯 **Multi-order effects modeling** (1st, 2nd, and 3rd order)
- 📈 **Interactive dashboard** with real-time updates
- 🚀 **No mock data** - 100% powered by Google Gemini AI

---
