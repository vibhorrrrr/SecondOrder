import random

from business_state import BusinessState


def apply_first_order_effects(state: BusinessState) -> BusinessState:
    """
    Calculates direct outcomes based on current state and actions.

    Includes stochastic noise for Monte Carlo variance (HP-4):
    - Acquisition noise: ±10% (conversion variance)
    - Churn noise: ±15% (monthly volatility)
    - Revenue noise: ±5% (spending variance)

    Formulas:
    - new_customers = (ad_spend / CAC) * acquisition_noise
    - churned_customers = customers * churn_rate * churn_noise (HP-1)
    - customers = customers + new_customers - churned_customers (HP-1)
    - revenue = customers * ARPU * revenue_noise
    - LTV = ARPU / churn_rate (HP-1: derived, not input)
    - cash_next = cash + revenue - burn - ad_spend
    """
    # Stochastic noise factors (HP-4)
    acquisition_noise = random.uniform(0.90, 1.10)  # ±10%
    churn_noise = random.uniform(0.85, 1.15)        # ±15%
    revenue_noise = random.uniform(0.95, 1.05)      # ±5%

    # Calculate new customers with acquisition noise
    if state.cac > 0:
        state.new_customers = int((state.ad_spend / state.cac) * acquisition_noise)
    else:
        state.new_customers = 0

    # Calculate churned customers with churn noise (HP-1 + HP-4)
    state.churned_customers = int(state.customers * state.churn_rate * churn_noise)

    # Update total customers (now includes churn subtraction)
    state.customers = state.customers + state.new_customers - state.churned_customers

    # Derive LTV from ARPU and churn_rate (HP-1)
    if state.churn_rate > 0:
        state.ltv = state.arpu / state.churn_rate
    else:
        state.ltv = state.arpu * 100  # Cap at 100 months if no churn

    # Calculate revenue with revenue noise (HP-4)
    state.revenue = state.customers * state.arpu * revenue_noise
    
    # Update cash
    # Assuming 'cost' in the prompt refers to ad_spend as it's the variable action
    # and burn is fixed operational costs.
    state.cash = state.cash + state.revenue - state.burn - state.ad_spend
    
    # Update runway
    total_monthly_spend = state.burn + state.ad_spend
    if total_monthly_spend > 0:
        state.runway = state.cash / total_monthly_spend
    else:
        state.runway = 999.0 # Infinite runway
        
    return state
