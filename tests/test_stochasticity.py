"""Test stochasticity changes (HP-4)

Tests that Monte Carlo simulations have proper variance and reproducibility:
1. Multiple runs without seed produce different results
2. Same seed produces identical results
3. Different seeds produce different results
"""

import pytest
from business_state import BusinessState
from monte_carlo import run_all_simulations
from utils.schemas import ThirdOrderModifiers


@pytest.fixture
def test_state():
    """Create a standard test business state."""
    return BusinessState(
        cash=500000,
        burn=50000,
        customers=100,
        cac=200,
        ltv=2000,
        arpu=100,
        ad_spend=20000,
        revenue=10000,
        new_customers=0,
        traffic=1000,
        runway=10,
        churn_rate=0.05
    )


@pytest.fixture
def neutral_modifiers():
    """Create neutral third-order modifiers (no Gemini effects)."""
    return ThirdOrderModifiers(
        burn_multiplier=1.0,
        ARPU_shift=0.0,
        CAC_drift=1.0,
        strategic_penalty=0.0,
        long_term_risk=0.0,
        demand_adjustments=1.0
    )


@pytest.fixture
def action():
    """Standard action for testing."""
    return {"ad_spend": 25000}


class TestStochasticVariance:
    """Test that simulations have proper variance (HP-4)."""

    def test_unseeded_runs_differ(self, test_state, neutral_modifiers, action):
        """Multiple runs without seed should produce different results."""
        results1 = run_all_simulations(
            test_state, action, neutral_modifiers, months=6, num_runs=3
        )
        results2 = run_all_simulations(
            test_state, action, neutral_modifiers, months=6, num_runs=3
        )

        cash1 = [r["final_cash"] for r in results1]
        cash2 = [r["final_cash"] for r in results2]

        # At least one value should differ between runs
        assert cash1 != cash2, "Unseeded runs should produce different results"

    def test_same_seed_reproduces_results(self, test_state, neutral_modifiers, action):
        """Same seed should produce identical results."""
        results1 = run_all_simulations(
            test_state, action, neutral_modifiers, months=6, num_runs=3, base_seed=42
        )
        results2 = run_all_simulations(
            test_state, action, neutral_modifiers, months=6, num_runs=3, base_seed=42
        )

        cash1 = [r["final_cash"] for r in results1]
        cash2 = [r["final_cash"] for r in results2]

        assert cash1 == cash2, "Same seed should produce identical results"

    def test_different_seeds_differ(self, test_state, neutral_modifiers, action):
        """Different seeds should produce different results."""
        results1 = run_all_simulations(
            test_state, action, neutral_modifiers, months=6, num_runs=3, base_seed=42
        )
        results2 = run_all_simulations(
            test_state, action, neutral_modifiers, months=6, num_runs=3, base_seed=99
        )

        cash1 = [r["final_cash"] for r in results1]
        cash2 = [r["final_cash"] for r in results2]

        assert cash1 != cash2, "Different seeds should produce different results"

    def test_variance_within_run(self, test_state, neutral_modifiers, action):
        """Individual runs within a simulation should have variance."""
        results = run_all_simulations(
            test_state, action, neutral_modifiers, months=6, num_runs=5, base_seed=42
        )

        cash_values = [r["final_cash"] for r in results]
        unique_values = set(cash_values)

        # With 5 runs, we should have multiple unique values
        assert len(unique_values) > 1, "Runs within simulation should have variance"
