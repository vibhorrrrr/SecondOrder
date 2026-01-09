"""
Simulation Engine
=================
Integrates Causal Graphs and Bet Sizing to provide the simulation environment for MCTS.
Acts as the bridge between the Abstract Strategy (MCTS) and the Physics (Causal Graph).
"""

import copy
from typing import List, Dict, Tuple, Any, Union
from dataclasses import asdict

from causal_graph_prototype import (
    BusinessState, 
    CausalGraph, 
    build_prototype_graph, 
    propagate_effects, 
    calculate_basic_financials,
    LaggedEffect
)
from bet_sizing import Discretizer, StrategicGroup, MonthlyPolicy, create_default_discretizer

class SimulationEngine:
    """
    The environment for the MCTS agent.
    Key Responsibilities:
    1. Define Action Space (Get available Strategic Groups)
    2. Execute Actions (Step the simulation forward)
    3. Evaluate State (Calculate score/reward)
    """

    def __init__(self):
        self.graph: CausalGraph = build_prototype_graph()
        self.discretizer: Discretizer = create_default_discretizer()
        
        # Simulation Parameters
        self.max_months = 12
        self.target_cash = 1000000  # for scoring
        self.penalty_burn = 50000   # penalty threshold
        
        # Baselines (should be part of state or config in full version)
        self.baseline_cac = 100.0
        self.baseline_conversion = 0.05 # 5%
    
    def get_initial_state(self) -> Tuple[BusinessState, List[LaggedEffect]]:
        """Returns standard initial state"""
        state = BusinessState(
            cash=500000,
            customers=1000,
            ad_spend=0,
            cac=self.baseline_cac,
            arpu=50,
            burn=20000,
            churn_rate=0.05,
            month=0
        )
        lagged_effects: List[LaggedEffect] = []
        return state, lagged_effects

    def get_legal_moves(self) -> List[MonthlyPolicy]:
        """
        Returns the discrete moves available to the agent.
        Now returns combinatorial MonthlyPolicy objects (e.g. Spend + Price).
        """
        return self.discretizer.generate_all_policies()

    def step(self, 
             state: BusinessState, 
             lagged_effects: List[LaggedEffect], 
             policy: MonthlyPolicy) -> Tuple[BusinessState, List[LaggedEffect]]:
        """
        Executes one month of simulation based on the selected MonthlyPolicy.
        Now includes PROBABILISTIC PRIOR SAMPLING.
        """
        # 1. Clone state to avoid mutation side effects
        new_state = copy.deepcopy(state)
        new_effects = copy.deepcopy(lagged_effects)
        new_state.month += 1
        
        # 2a. Realize the Bets (Sample specific values for inputs)
        for var_name, group in policy.decisions.items():
            value = group.sample()
            if hasattr(new_state, var_name):
                setattr(new_state, var_name, value)
                
        # 2b. APPLY PRIORS (Sample outcomes for downstream vars)
        # This is where we inject the "Risk" and "Non-linear effects"
        for group in policy.decisions.values():
            for prior in group.priors:
                # Sample the multiplier (e.g. 1.4x for Blitz spend)
                multiplier = prior.distribution.sample_multiplier()
                
                # Apply to state
                # Note: This logic overrides the previous state value with a fresh sample from baseline
                # effectively modeling "Monthly Performance" based on current choice.
                # In a more complex model, this might be a delta on previous state.
                if prior.target_variable == "cac":
                    # CAC = Baseline * Multiplier
                    new_state.cac = self.baseline_cac * multiplier
                
                elif prior.target_variable == "conversion_rate":
                    # We don't track conversion_rate explicitly in BusinessState yet, 
                    # but let's assume it affects new_customers calculation.
                    # For now, we'll store it in a temporary way or update 'new_customers' formula
                    # In this minimal prototype, let's treat it as a modifier on CAC (inverse) or new customers.
                    # Let's say: New Customers = Spend / (Baseline CAC / ConversionMult)
                    # Actually, easier: Update CAC inversely (Higher conv = Lower CAC)
                    # But wait, we have pricing priors.
                    # Let's model Conversion impact by modifying the effective CAC directly for this step.
                    # If Conversion drops by 0.5x, CAC doubles by 2x.
                    
                    if multiplier > 0:
                         # Inverse relationship: Lower conversion -> Higher CAC
                         # But wait, we already set CAC from Ad Spend prior.
                         # We need to combine them.
                         # Effect = CAC_from_Spend * (1/Conversion_from_Price)
                         new_state.cac = new_state.cac * (1.0 / multiplier)
                    else:
                         new_state.cac = 9999.0 # Effectively 0 conversions

        
        # 3. Propagate Causal Effects (The "Physics" takes over)
        # The Graph now sees the updated 'ad_spend' and the risk-adjusted 'cac'
        # and propagates second/third order effects (like burn, saturation)
        new_state, new_effects, _ = propagate_effects(new_state, self.graph, new_effects)
        
        # 4. Update Financials
        new_state = calculate_basic_financials(new_state)
        
        return new_state, new_effects

    def evaluate(self, state: BusinessState) -> float:
        """
        Heuristic scoring function for MCTS rollout.
        Higher is better.
        """
        # Simple score: Cash + (Customers * LTV proxy) - Penalty for risks
        
        # 1. Cash Score (Normalized)
        cash_score = state.cash / 100000
        
        # 2. Growth Score
        growth_score = (state.customers / 100) * (state.arpu / 50)
        
        # 3. Risk Penalties (Strategic Metrics)
        risk_penalty = 0
        if state.market_saturation > 0.8: risk_penalty += 50
        if state.cultural_degradation > 0.3: risk_penalty += 30
        if state.cash < 0: return -1000 # Bankruptcy
        
        score = cash_score + growth_score - risk_penalty
        return score

    def is_terminal(self, state: BusinessState) -> bool:
        """Check if simulation should end"""
        return state.month >= self.max_months or state.cash < 0

# Test
if __name__ == "__main__":
    sim = SimulationEngine()
    state, effects = sim.get_initial_state()
    moves = sim.get_legal_moves()
    
    print(f"Generated {len(moves)} combined policies.")
    
    # Pick a risky move: Blitz Spend + Elite Price
    # This should result in High CAC (Blitz) and Low Conversion (Elite) -> Ultra High Effective CAC
    move = moves[-1] 
    print(f"\nSelecting Move: {move.name}")
    print(move.description)
    
    state, effects = sim.step(state, effects, move)
    
    print(f"New State (Month {state.month}):")
    print(f"  Ad Spend: ${state.ad_spend:,.0f}")
    print(f"  ARPU: ${state.arpu:.2f}")
    print(f"  CAC: ${state.cac:.2f} (Should be very high)")
    print(f"  New Customers: {state.new_customers}")
