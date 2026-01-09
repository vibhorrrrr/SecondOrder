"""
Constraint validation for business simulation state (HP-5).

Provides validation and enforcement of mathematical integrity constraints
to ensure simulation results stay within sensible bounds.
"""

import logging
from dataclasses import dataclass, field
from typing import List

from business_state import BusinessState

logger = logging.getLogger(__name__)


@dataclass
class ConstraintViolation:
    """Records a single constraint violation."""
    variable: str
    value: float
    constraint: str
    message: str
    month: int


@dataclass
class ValidationResult:
    """Result of validating a BusinessState."""
    is_valid: bool
    violations: List[ConstraintViolation] = field(default_factory=list)

    def add_violation(self, variable: str, value: float, constraint: str, message: str, month: int):
        self.violations.append(ConstraintViolation(
            variable=variable,
            value=value,
            constraint=constraint,
            message=message,
            month=month
        ))
        self.is_valid = False


def validate_state(state: BusinessState) -> ValidationResult:
    """
    Validates a BusinessState against mathematical integrity constraints.

    Checks:
    - Non-negative constraints: cash, customers, revenue, burn, ad_spend
    - Rate bounds: churn_rate must be in [0, 1]
    - Logical constraints: new_customers >= 0, churned_customers >= 0

    Args:
        state: The BusinessState to validate

    Returns:
        ValidationResult with any violations found
    """
    result = ValidationResult(is_valid=True)
    month = state.month

    # Non-negative constraints
    if state.customers < 0:
        result.add_violation(
            "customers", state.customers, "non_negative",
            f"Negative customers: {state.customers}", month
        )

    if state.new_customers < 0:
        result.add_violation(
            "new_customers", state.new_customers, "non_negative",
            f"Negative new_customers: {state.new_customers}", month
        )

    if state.churned_customers < 0:
        result.add_violation(
            "churned_customers", state.churned_customers, "non_negative",
            f"Negative churned_customers: {state.churned_customers}", month
        )

    if state.revenue < 0:
        result.add_violation(
            "revenue", state.revenue, "non_negative",
            f"Negative revenue: {state.revenue}", month
        )

    if state.burn < 0:
        result.add_violation(
            "burn", state.burn, "non_negative",
            f"Negative burn: {state.burn}", month
        )

    if state.ad_spend < 0:
        result.add_violation(
            "ad_spend", state.ad_spend, "non_negative",
            f"Negative ad_spend: {state.ad_spend}", month
        )

    if state.cac < 0:
        result.add_violation(
            "cac", state.cac, "non_negative",
            f"Negative CAC: {state.cac}", month
        )

    if state.arpu < 0:
        result.add_violation(
            "arpu", state.arpu, "non_negative",
            f"Negative ARPU: {state.arpu}", month
        )

    if state.traffic < 0:
        result.add_violation(
            "traffic", state.traffic, "non_negative",
            f"Negative traffic: {state.traffic}", month
        )

    # Rate bounds
    if state.churn_rate < 0 or state.churn_rate > 1:
        result.add_violation(
            "churn_rate", state.churn_rate, "rate_bounds",
            f"Invalid churn_rate (must be 0-1): {state.churn_rate}", month
        )

    # Note: cash CAN be negative (represents debt/deficit)
    # We log a warning but don't treat it as a constraint violation
    if state.cash < 0:
        logger.debug(f"Month {month}: Negative cash balance: {state.cash}")

    return result


def enforce_constraints(state: BusinessState) -> BusinessState:
    """
    Enforces constraints by clamping values to valid ranges.

    This is called after validation to ensure the simulation can continue
    even if edge cases produce invalid intermediate values.

    Args:
        state: The BusinessState to enforce constraints on

    Returns:
        The same BusinessState with values clamped to valid ranges
    """
    # Clamp non-negative values
    state.customers = max(0, state.customers)
    state.new_customers = max(0, state.new_customers)
    state.churned_customers = max(0, state.churned_customers)
    state.revenue = max(0.0, state.revenue)
    state.burn = max(0.0, state.burn)
    state.ad_spend = max(0.0, state.ad_spend)
    state.cac = max(0.01, state.cac)  # Prevent division by zero
    state.arpu = max(0.0, state.arpu)
    state.traffic = max(0, state.traffic)

    # Clamp churn_rate to [0, 1]
    state.churn_rate = max(0.0, min(1.0, state.churn_rate))

    # Note: cash is NOT clamped - negative cash represents debt
    # Note: runway is NOT clamped - negative runway indicates insolvency

    return state


def validate_and_enforce(
    state: BusinessState,
    log_violations: bool = True
) -> tuple[BusinessState, ValidationResult]:
    """
    Validates state and enforces constraints in one call.

    Args:
        state: The BusinessState to validate and enforce
        log_violations: Whether to log violations as warnings

    Returns:
        Tuple of (enforced state, validation result)
    """
    result = validate_state(state)

    if log_violations and not result.is_valid:
        for violation in result.violations:
            logger.warning(
                f"Constraint violation at month {violation.month}: "
                f"{violation.message}"
            )

    enforce_constraints(state)

    return state, result
