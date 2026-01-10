# 🚀 Quick Start Guide

## Step 1: Get Your Google API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

## Step 2: Configure Environment

```bash
# Create .env file with your API key
echo "GOOGLE_API_KEY=your-actual-api-key-here" > .env
```

## Step 3: Start the Application

```bash
# Make start script executable (first time only)
chmod +x start.sh

# Start both backend and frontend
./start.sh
```

The script will:
- ✅ Check all dependencies
- ✅ Install Python packages
- ✅ Install Node.js packages
- ✅ Start backend on port 8000
- ✅ Start frontend on port 5173
- ✅ Show live logs

## Step 4: Access the Application

Open your browser and go to: **http://localhost:5173**

## Step 5: Stop the Application

```bash
./stop.sh
```

Or press `Ctrl+C` in the terminal where `start.sh` is running.

---

## 🎯 What You Can Do

1. **View Current Business State**
   - See key metrics like cash, burn rate, CAC, LTV, etc.

2. **Generate AI Strategic Options**
   - Click "Generate Strategic Options"
   - Get 3-5 AI-powered strategic decisions from Gemini 2.0

3. **Run Monte Carlo Simulations**
   - Select a strategic option
   - Click "Run Simulation"
   - See probability distributions (P10, P50, P90)
   - View 12-month projections

4. **Analyze Multi-Order Effects**
   - **1st Order**: Direct impacts (e.g., spend more → get more customers)
   - **2nd Order**: System feedback (e.g., more customers → higher support costs)
   - **3rd Order**: Strategic emergence (e.g., competitor response, market shifts)

---

## 📊 Example Scenario

**Starting State:**
- Cash: $1,000,000
- Burn: $50,000/month
- Revenue: $20,000/month
- Runway: 20 months
- CAC: $100, LTV: $1,200

**AI-Generated Options (Real Gemini Output):**
1. **Increase Ad Spend** - Higher growth but increased burn
2. **Customer Success Program** - Better retention, higher LTV
3. **Freemium Tier** - Viral growth, conversion risk

**Run Simulation** to see:
- Probability of survival
- Cash projections over 12 months
- Risk scenarios (P10/P50/P90)

---

## 🔧 Troubleshooting

### "GOOGLE_API_KEY not found"
- Make sure `.env` file exists in the project root
- Check that it contains: `GOOGLE_API_KEY=your-key`

### "Port already in use"
- Run `./stop.sh` to stop existing processes
- Or manually: `pkill -f "python.*api.py" && pkill -f vite`

### "Dependencies not installed"
- Run: `pip install -r requirements.txt`
- Run: `cd ui && npm install`

### Check Logs
- Backend: `tail -f logs/backend.log`
- Frontend: `tail -f logs/frontend.log`

---

## 📚 Architecture

```
┌─────────────────┐
│  React Frontend │  (Port 5173)
│   Vite + Recharts│
└────────┬────────┘
         │
         │ REST API
         ▼
┌─────────────────┐
│ FastAPI Backend │  (Port 8000)
│  Monte Carlo    │
│  Simulation     │
└────────┬────────┘
         │
         │ API Calls
         ▼
┌─────────────────┐
│  Gemini 2.0     │
│  Flash/Pro      │
│  AI Analysis    │
└─────────────────┘
```

---

## 🎓 Learn More

- [Integration Architecture](integration_architecture.md)
- [Mathematical Model](mathematical_model.md)
- [Component Reuse](component_reuse.md)
- [Full README](README.md)

