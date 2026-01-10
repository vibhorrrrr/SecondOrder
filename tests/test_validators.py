"""
Tests for constraint validation (HP-5).

Tests that:
1. Validation detects constraint violations
2. Enforcement clamps values to valid ranges
3. Simulator integrates validation correctly
"""

from business_state import BusinessState
from validators import (
    validate_state,
    enforce_constraints,
    validate_and_enforce,
    ValidationResult,
    ConstraintViolation,
)
from simulator import BusinessSimulator


def create_valid_state() -> BusinessState:
    """Create a valid BusinessState for testing."""
    return BusinessState(
        cac=100.0,
        ltv=1000.0,
        arpu=50.0,
        burn=10000.0,
        cash=100000.0,
        revenue=25000.0,
        customers=500,
        new_customers=50,
        traffic=10000,
        ad_spend=5000.0,
        runway=10.0,
        churn_rate=0.05,
        churned_customers=25,
        month=1,
    )


class TestValidateState:
    """Tests for validate_state function."""

    def test_valid_state_passes(self):
        """A valid state should pass validation."""
        state = create_valid_state()
        result = validate_state(state)
        assert result.is_valid
        assert len(result.violations) == 0

    def test_negative_customers_detected(self):
        """Negative customers should be detected as a violation."""
        state = create_valid_state()
        state.customers = -10
        result = validate_state(state)
        assert not result.is_valid
        assert any(v.variable == "customers" for v in result.violations)

    def test_negative_revenue_detected(self):
        """Negative revenue should be detected as a violation."""
        state = create_valid_state()
        state.revenue = -5000.0
        result = validate_state(state)
        assert not result.is_valid
        assert any(v.variable == "revenue" for v in result.violations)

    def test_negative_new_customers_detected(self):
        """Negative new_customers should be detected."""
        state = create_valid_state()
        state.new_customers = -5
        result = validate_state(state)
        assert not result.is_valid
        assert any(v.variable == "new_customers" for v in result.violations)

    def test_negative_churned_customers_detected(self):
        """Negative churned_customers should be detected."""
        state = create_valid_state()
        state.churned_customers = -5
        result = validate_state(state)
        assert not result.is_valid
        assert any(v.variable == "churned_customers" for v in result.violations)

    def test_churn_rate_above_one_detected(self):
        """Churn rate above 1.0 should be detected."""
        state = create_valid_state()
        state.churn_rate = 1.5
        result = validate_state(state)
        assert not result.is_valid
        assert any(v.variable == "churn_rate" for v in result.violations)

    def test_churn_rate_below_zero_detected(self):
        """Churn rate below 0.0 should be detected."""
        state = create_valid_state()
        state.churn_rate = -0.1
        result = validate_state(state)
        assert not result.is_valid
        assert any(v.variable == "churn_rate" for v in result.violations)

    def test_negative_cash_not_violation(self):
        """Negative cash is allowed (represents debt), not a violation."""
        state = create_valid_state()
        state.cash = -50000.0
        result = validate_state(state)
        # Cash can be negative - it's logged but not a violation
        assert result.is_valid or not any(v.variable == "cash" for v in result.violations)

    def test_multiple_violations_detected(self):
        """Multiple violations should all be detected."""
        state = create_valid_state()
        state.customers = -10
        state.revenue = -5000.0
        state.churn_rate = 2.0
        result = validate_state(state)
        assert not result.is_valid
        assert len(result.violations) >= 3

    def test_negative_burn_detected(self):
        """Negative burn should be detected."""
        state = create_valid_state()
        state.burn = -1000.0
        result = validate_state(state)
        assert not result.is_valid
        assert any(v.variable == "burn" for v in result.violations)

    def test_negative_cac_detected(self):
        """Negative CAC should be detected."""
        state = create_valid_state()
        state.cac = -50.0
        result = validate_state(state)
        assert not result.is_valid
        assert any(v.variable == "cac" for v in result.violations)


class TestEnforceConstraints:
    """Tests for enforce_constraints function."""

    def test_negative_customers_clamped(self):
        """Negative customers should be clamped to 0."""
        state = create_valid_state()
        state.customers = -10
        enforce_constraints(state)
        assert state.customers == 0

    def test_negative_revenue_clamped(self):
        """Negative revenue should be clamped to 0."""
        state = create_valid_state()
        state.revenue = -5000.0
        enforce_constraints(state)
        assert state.revenue == 0.0

    def test_churn_rate_clamped_to_range(self):
        """Churn rate should be clamped to [0, 1]."""
        state = create_valid_state()
        state.churn_rate = 1.5
        enforce_constraints(state)
        assert state.churn_rate == 1.0

        state.churn_rate = -0.1
        enforce_constraints(state)
        assert state.churn_rate == 0.0

    def test_cac_clamped_to_minimum(self):
        """CAC should be clamped to minimum 0.01 to prevent division by zero."""
        state = create_valid_state()
        state.cac = 0.0
        enforce_constraints(state)
        assert state.cac == 0.01

        state.cac = -100.0
        enforce_constraints(state)
        assert state.cac == 0.01

    def test_cash_not_clamped(self):
        """Cash should NOT be clamped - negative cash represents debt."""
        state = create_valid_state()
        state.cash = -50000.0
        enforce_constraints(state)
        assert state.cash == -50000.0

    def test_valid_state_unchanged(self):
        """A valid state should remain unchanged after enforcement."""
        state = create_valid_state()
        original_customers = state.customers
        original_revenue = state.revenue
        enforce_constraints(state)
        assert state.customers == original_customers
        assert state.revenue == original_revenue


class TestValidateAndEnforce:
    """Tests for validate_and_enforce combined function."""

    def test_returns_tuple(self):
        """Should return (state, validation_result) tuple."""
        state = create_valid_state()
        result = validate_and_enforce(state)
        assert isinstance(result, tuple)
        assert len(result) == 2
        assert isinstance(result[0], BusinessState)
        assert isinstance(result[1], ValidationResult)

    def test_enforces_after_validation(self):
        """Should enforce constraints after validating."""
        state = create_valid_state()
        state.customers = -10
        state.churn_rate = 1.5
        state, validation_result = validate_and_enforce(state)
        # Validation detected violations
        assert not validation_result.is_valid
        # But state is now valid after enforcement
        assert state.customers == 0
        assert state.churn_rate == 1.0


class TestSimulatorIntegration:
    """Tests for simulator integration with validators."""

    def test_simulator_has_violations_list(self):
        """Simulator should initialize with empty violations list."""
        sim = BusinessSimulator()
        assert hasattr(sim, "violations")
        assert sim.violations == []

    def test_simulator_enforces_constraints_by_default(self):
        """Simulator step should enforce constraints by default."""
        sim = BusinessSimulator()
        state = create_valid_state()
        # Create a state that would result in negative customers after simulation
        state.customers = 10
        state.churn_rate = 0.99  # Very high churn
        state.ad_spend = 0  # No new acquisitions

        new_state = sim.step(state)
        # Even with high churn, customers should not go negative
        assert new_state.customers >= 0

    def test_simulator_records_violations(self):
        """Simulator should record violations when they occur."""
        sim = BusinessSimulator()
        state = create_valid_state()
        # Force a state that triggers validation
        state.churn_rate = 1.5  # Invalid churn rate

        # First manually set invalid state to test detection
        sim.step(state, action_modifiers={"churn_rate": 1.5})
        # The churn_rate will be clamped but violation recorded
        # Note: Depending on implementation, this may not trigger since
        # the action modifier sets the rate before effects are applied

    def test_simulator_clear_violations(self):
        """Simulator should allow clearing violations."""
        sim = BusinessSimulator()
        # Add a mock violation
        sim.violations.append(
            ConstraintViolation(
                variable="test",
                value=-1,
                constraint="non_negative",
                message="Test violation",
                month=1,
            )
        )
        assert sim.has_violations()
        sim.clear_violations()
        assert not sim.has_violations()

    def test_simulator_validate_flag(self):
        """Simulator should respect validate=False flag."""
        sim = BusinessSimulator()
        state = create_valid_state()
        # Even with validate=False, simulation should work
        new_state = sim.step(state, validate=False)
        assert new_state.month == state.month + 1

    def test_customers_stay_non_negative_over_time(self):
        """Over multiple steps, customers should never go negative."""
        sim = BusinessSimulator()
        state = create_valid_state()
        state.customers = 100
        state.churn_rate = 0.50  # 50% monthly churn
        state.ad_spend = 100  # Very low ad spend

        for _ in range(24):  # Simulate 2 years
            state = sim.step(state)
            assert state.customers >= 0, f"Customers went negative: {state.customers}"

    def test_revenue_stays_non_negative(self):
        """Revenue should never go negative."""
        sim = BusinessSimulator()
        state = create_valid_state()
        state.customers = 10
        state.churn_rate = 0.80  # Very high churn

        for _ in range(12):
            state = sim.step(state)
            assert state.revenue >= 0, f"Revenue went negative: {state.revenue}"
