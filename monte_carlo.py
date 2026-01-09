"""
Monte Carlo simulation engine.

Orchestrates multiple simulation runs with Gemini-derived third-order modifiers
and computes statistical outcomes.
"""
import random
from typing import Dict, Any, List, Optional

import numpy as np

from business_state import BusinessState
from simulator import BusinessSimulator
from utils.gemini_client import call_gemini_with_schema
from utils.schemas import ThirdOrderModifiers, StrategicAnalysis


# -----------------------------------------------------------------------------
# State Helpers
# -----------------------------------------------------------------------------

def apply_action_to_state(state: BusinessState, action_modifiers: Dict[str, Any]) -> BusinessState:
    """Creates a new state with action modifiers applied."""
    new_state = BusinessState.from_dict(state.to_dict())
    for key, value in action_modifiers.items():
        if hasattr(new_state, key):
            setattr(new_state, key, value)
    return new_state


# -----------------------------------------------------------------------------
# Gemini: Third-Order Modifiers
# -----------------------------------------------------------------------------

def build_modifiers_prompt(state: BusinessState, months: int) -> str:
    """Builds the prompt for fetching third-order strategic modifiers."""
    return f"""
You are a strategic business simulation engine.
Analyze the proposed state/action and determine 3rd order effects (strategic emergent effects) for a {months}-month projection.

State with Action Applied:
{state.to_dict()}

Return the modifiers as JSON.
"""


def fetch_third_order_modifiers(state: BusinessState, months: int) -> ThirdOrderModifiers:
    """Fetches third-order modifiers from Gemini with schema validation."""
    prompt = build_modifiers_prompt(state, months)
    return call_gemini_with_schema(prompt, ThirdOrderModifiers)


# -----------------------------------------------------------------------------
# Simulation Execution
# -----------------------------------------------------------------------------

def run_single_simulation(
    initial_state: BusinessState,
    action_modifiers: Dict[str, Any],
    gemini_modifiers: ThirdOrderModifiers,
    months: int,
    simulator: BusinessSimulator,
    run_seed: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Runs a single Monte Carlo simulation path.

    Args:
        initial_state: Starting business state.
        action_modifiers: Dict of changes to state variables.
        gemini_modifiers: Third-order modifiers from Gemini.
        months: Number of months to simulate.
        simulator: BusinessSimulator instance.
        run_seed: Optional seed for reproducible randomness (HP-4).

    Returns:
        Dict with 'trace' (list of state dicts), 'final_cash', and 'survived'.
    """
    # Set seed for reproducibility if provided (HP-4)
    if run_seed is not None:
        random.seed(run_seed)

    current_state = BusinessState.from_dict(initial_state.to_dict())
    trace: List[Dict[str, Any]] = []

    modifiers_dict = gemini_modifiers.model_dump()

    for _ in range(months):
        current_state = simulator.step(current_state, action_modifiers, modifiers_dict)
        trace.append(current_state.to_dict())

    return {
        "trace": trace,
        "final_cash": current_state.cash,
        "survived": current_state.cash > 0,
    }


def run_all_simulations(
    initial_state: BusinessState,
    action_modifiers: Dict[str, Any],
    gemini_modifiers: ThirdOrderModifiers,
    months: int,
    num_runs: int,
    base_seed: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Runs all Monte Carlo simulation paths.

    Args:
        initial_state: Starting business state.
        action_modifiers: Dict of changes to state variables.
        gemini_modifiers: Third-order modifiers from Gemini.
        months: Number of months to simulate.
        num_runs: Number of simulation paths to run.
        base_seed: Optional base seed for reproducibility (HP-4).
                   Each run uses base_seed + run_index as its seed.
    """
    simulator = BusinessSimulator()
    results = []

    for i in range(num_runs):
        run_seed = (base_seed + i) if base_seed is not None else None
        result = run_single_simulation(
            initial_state, action_modifiers, gemini_modifiers, months, simulator, run_seed
        )
        results.append(result)

    return results


# -----------------------------------------------------------------------------
# Statistics
# -----------------------------------------------------------------------------

def compute_final_statistics(simulation_results: List[Dict[str, Any]]) -> Dict[str, float]:
    """Computes final cash percentiles and survival probability."""
    final_cash_values = np.array([r["final_cash"] for r in simulation_results])
    survived_count = sum(1 for r in simulation_results if r["survived"])
    
    return {
        "p10": float(np.percentile(final_cash_values, 10)),
        "p50": float(np.percentile(final_cash_values, 50)),
        "p90": float(np.percentile(final_cash_values, 90)),
        "survival_probability": survived_count / len(simulation_results),
    }


def compute_cash_time_series(
    simulation_results: List[Dict[str, Any]], months: int
) -> List[Dict[str, Any]]:
    """Computes monthly cash percentiles across all runs."""
    traces = [r["trace"] for r in simulation_results]
    series = []
    
    for month_idx in range(months):
        month_cash = [trace[month_idx]["cash"] for trace in traces]
        series.append({
            "month": month_idx + 1,
            "p10": float(np.percentile(month_cash, 10)),
            "p50": float(np.percentile(month_cash, 50)),
            "p90": float(np.percentile(month_cash, 90)),
        })
    
    return series


# -----------------------------------------------------------------------------
# Gemini: Strategic Analysis
# -----------------------------------------------------------------------------

def build_analysis_prompt(
    initial_state: BusinessState,
    action_modifiers: Dict[str, Any],
    gemini_modifiers: ThirdOrderModifiers,
    stats: Dict[str, float],
    months: int,
    num_runs: int,
) -> str:
    """Builds the prompt for strategic analysis (recommendations/risks/opportunities)."""
    return f"""
You are a pragmatic finance + strategy advisor.

Given this simulation output, write concise bullet-style outputs.

Inputs:
- months: {months}
- num_runs: {num_runs}
- initial_state: {initial_state.to_dict()}
- action_modifiers_applied: {action_modifiers}
- gemini_modifiers_used: {gemini_modifiers.model_dump()}
- survival_probability: {stats['survival_probability']}
- final_cash_percentiles: {{ "p10": {stats['p10']}, "p50": {stats['p50']}, "p90": {stats['p90']} }}

Return up to 5 items per category as JSON.
"""


def fetch_strategic_analysis(
    initial_state: BusinessState,
    action_modifiers: Dict[str, Any],
    gemini_modifiers: ThirdOrderModifiers,
    stats: Dict[str, float],
    months: int,
    num_runs: int,
) -> StrategicAnalysis:
    """Fetches strategic analysis from Gemini with schema validation."""
    prompt = build_analysis_prompt(
        initial_state, action_modifiers, gemini_modifiers, stats, months, num_runs
    )
    return call_gemini_with_schema(prompt, StrategicAnalysis)


# -----------------------------------------------------------------------------
# Main Entry Point
# -----------------------------------------------------------------------------

def run_monte_carlo(
    initial_state: BusinessState,
    action_modifiers: Dict[str, Any],
    months: int = 12,
    num_runs: int = 50,
    seed: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Runs Monte Carlo simulation with Gemini-derived modifiers.

    1. Applies action modifiers to initial state
    2. Fetches third-order modifiers from Gemini
    3. Runs N simulation paths (with stochastic variance - HP-4)
    4. Computes statistics
    5. Fetches strategic analysis from Gemini

    Args:
        initial_state: Starting business state.
        action_modifiers: Dict of changes to state variables.
        months: Number of months to simulate.
        num_runs: Number of Monte Carlo paths.
        seed: Optional seed for reproducible results (HP-4).

    Returns:
        Dict with survival probability, percentiles, time series, traces, and Gemini analysis.
    """
    # Prepare state with action applied (for Gemini context)
    projected_state = apply_action_to_state(initial_state, action_modifiers)

    # Get third-order modifiers from Gemini
    gemini_modifiers = fetch_third_order_modifiers(projected_state, months)

    # Run all simulations (with stochastic variance - HP-4)
    simulation_results = run_all_simulations(
        initial_state, action_modifiers, gemini_modifiers, months, num_runs, seed
    )
    
    # Compute statistics
    stats = compute_final_statistics(simulation_results)
    cash_series = compute_cash_time_series(simulation_results, months)
    
    # Get strategic analysis from Gemini
    analysis = fetch_strategic_analysis(
        initial_state, action_modifiers, gemini_modifiers, stats, months, num_runs
    )
    
    # Collect all traces
    traces = [r["trace"] for r in simulation_results]
    
    return {
        "survival_probability": stats["survival_probability"],
        "p10": stats["p10"],
        "p50": stats["p50"],
        "p90": stats["p90"],
        "series": cash_series,
        "traces": traces,
        "gemini_modifiers": gemini_modifiers.model_dump(),
        "gemini_recommendations": analysis.recommendations,
        "gemini_risks": analysis.risks,
        "gemini_opportunities": analysis.opportunities,
        "gemini_analysis": analysis.model_dump(),
    }
