# Minimal Sim - Monte Carlo Business Simulator

A Monte Carlo business simulation engine that models strategic decision-making scenarios using Google Gemini AI for strategic analysis and third-order effects prediction.

## Technology Stack

- **Backend**: FastAPI (Python 3.12+)
- **Frontend**: React + Vite
- **AI Framework**: Google Gemini 2.0 Flash (via google-genai SDK)
- **Simulation Engine**: Custom Monte Carlo engine with multi-order effects modeling
- **Virtual Environment**: `.venv` (local directory)

## Quick Start Commands

```bash
# Start all services (frontend and backend)
./start.sh

# Stop application services
./stop.sh

# Check service status
./status.sh

# Run tests
source .venv/bin/activate && python -m pytest tests/ -v
```

## Key Directories

```
minimal_sim/
├── Core Simulation Engine (Root Directory)
│   ├── api.py                      # FastAPI server with /simulate and /generate_nodes endpoints
│   ├── business_state.py           # BusinessState dataclass (cash, burn, CAC, ARPU, etc.)
│   ├── monte_carlo.py              # Main Monte Carlo orchestration engine
│   ├── simulator.py                # BusinessSimulator class - single timestep execution
│   ├── first_order.py              # Direct effects (ad_spend → customers → revenue)
│   ├── second_order.py             # Feedback loops (scale effects, operational overhead)
│   ├── third_order_gemini.py       # Strategic emergent effects via Gemini
│   ├── node_generation_gemini.py   # Generates strategic decision options via Gemini
│   ├── demo.py                     # Standalone demo script
│   └── test_sim.py                 # Basic simulation tests
│
├── utils/                          # Shared utilities
│   ├── gemini_client.py            # Gemini API client with JSON schema enforcement
│   └── schemas.py                  # Pydantic schemas for Gemini responses
│
├── tests/                          # Test suite
│   └── test_gemini_schema.py       # Tests for Gemini schema validation
│
├── ui/                             # React frontend
│   └── src/
│       ├── components/             # React UI components
│       ├── services/               # API client services
│       ├── App.jsx                 # Main application component
│       └── main.jsx                # Entry point
│
├── app/                            # Legacy directories (mostly empty)
│   ├── backend/                    # Empty - not used in this branch
│   └── frontend/                   # Separate frontend (if needed)
│
├── core/                           # Empty - not used in this branch
├── data/                           # Data storage (simulation outputs)
└── logs/                           # Application logs (git-ignored)
```

## Architecture Overview

This is a **Monte Carlo simulator** for SaaS business decisions, not a multi-agent system. The key components are:

### 1. Simulation Flow (monte_carlo.py)
The main entry point that orchestrates:
1. Apply action modifiers to initial state
2. Fetch third-order strategic modifiers from Gemini
3. Run N simulation paths (each with stochastic noise)
4. Compute statistics (p10/p50/p90, survival probability)
5. Fetch strategic analysis from Gemini (recommendations, risks, opportunities)

### 2. Multi-Order Effects Model
The simulation uses a three-tier effects model:

- **First Order** (first_order.py): Direct mechanical effects
  - ad_spend / CAC = new_customers
  - customers * ARPU = revenue
  - cash + revenue - burn - ad_spend = new_cash

- **Second Order** (second_order.py): System feedback loops
  - High ad spend → CAC efficiency improvement
  - More customers → higher operational burn
  - High CAC → lower LTV (quality impact)

- **Third Order** (third_order_gemini.py): Strategic emergent effects
  - Uses Gemini to predict: burn_multiplier, ARPU_shift, CAC_drift
  - Considers: core degradation, cultural complexity, market response
  - Applied stochastically with ±5% noise per simulation run

### 3. Business State
Defined in `business_state.py` as a dataclass with fields:
- Financial: cash, burn, revenue, runway
- Customer metrics: customers, new_customers, CAC, LTV, ARPU
- Marketing: ad_spend, traffic
- Tracking: month

### 4. Gemini Integration
Uses structured JSON schema outputs via Pydantic models:
- **ThirdOrderModifiers**: Strategic physics for simulation
- **StrategicAnalysis**: Recommendations, risks, opportunities
- **StrategicDecisions**: Generated decision options with impact analysis

## Service Endpoints

- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:8000 (FastAPI)
- **API Documentation**: http://localhost:8000/docs (Swagger UI)

### Key API Endpoints

**POST /simulate**
- Runs Monte Carlo simulation for a given state and action
- Request body: `{initial_state, action, months, num_runs}`
- Returns: survival probability, percentiles, time series, Gemini analysis

**POST /generate_nodes**
- Generates strategic decision options via Gemini
- Request body: `{state}`
- Returns: 3-5 strategic decisions with impact analysis

## Standard Workflows

### 1. Implementing Code Changes

When the user requests code changes, follow this **mandatory sequence**:

```
1. Implement → 2. Test → 3. Cleanup → 4. E2E Verify (if UI changes)
```

**Phase 1: Implementation**
- Make the requested code changes
- Follow coding standards (see below)
- Keep changes focused and minimal

**Phase 2: Testing with `tester` agent**
- **Always use** the `tester` agent after ANY code changes
- Agent stops services, restarts them, runs tests, verifies APIs
- Command: "Use the tester agent to verify these changes"

**Phase 3: Code Quality with `cleanup` agent**
- **Always use** after tester passes
- Agent refactors for maintainability, fixes imports, improves logging
- Command: "Use the cleanup agent to refine code quality"

**Phase 4: E2E Testing with `journey` agent** (UI changes only)
- Use for user-facing features that need browser testing
- Agent simulates real user journeys, captures screenshots
- Command: "Use the journey agent to test the user flow"

### 2. Exploring the Codebase

**Before making changes**, understand existing patterns:
- Use Glob to find relevant files by pattern
- Use Grep to search for similar implementations
- Read key files to understand architecture
- Never propose changes without reading the target file first

### 3. Adding New Features

**Standard approach:**
1. Search for similar existing features
2. Read relevant files to understand patterns
3. Implement following established conventions
4. Run `tester` agent to verify functionality
5. Run `cleanup` agent to ensure code quality
6. If UI feature: run `journey` agent for E2E validation

## Coding Standards

### Python (Backend)
- Use type hints for all function signatures
- Follow PEP 8 style guidelines
- Import organization: stdlib → third-party → local
- Async/await for I/O operations (FastAPI routes)
- Use Pydantic models for data validation
- Log at appropriate levels (DEBUG, INFO, WARNING, ERROR)
- Never swallow exceptions silently

### JavaScript/React (Frontend)
- Functional components with hooks
- Consistent prop typing
- Handle loading and error states in UI

### General Principles
- Single Responsibility: functions do one thing well
- Keep functions concise (5-20 lines typical)
- Descriptive variable/function names
- No commented-out code (git preserves history)
- Explicit over implicit

## Testing Requirements

**Tests verify:**
- Gemini API schema validation
- Simulation correctness
- API endpoint functionality
- Business logic accuracy

**Test execution:**
```bash
# Standard test run
source .venv/bin/activate && python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_gemini_schema.py -v

# Let the tester agent handle this automatically
```

## Environment Configuration

Required environment variables in `.env`:
```bash
GOOGLE_API_KEY=your-google-api-key-here
```

The `start.sh` script validates the environment before starting services.

## Key Simulation Parameters

Default values for Monte Carlo runs:
- **months**: 12 (simulation time horizon)
- **num_runs**: 20-50 (number of Monte Carlo paths)
- **noise_range**: ±5% per simulation run

Output statistics:
- **p10, p50, p90**: Cash percentiles across all runs
- **survival_probability**: Fraction of runs where cash > 0
- **series**: Monthly cash percentiles over time

## Custom Agent Workflow (Important)

The `.claude/agents/` directory contains custom agents for development workflows:

- **tester**: Tests code changes, starts services, runs tests
- **cleanup**: Refactors code for quality and maintainability
- **journey**: E2E browser testing for user journeys

**These agents are mandatory** for all code change workflows. Do not skip them.
