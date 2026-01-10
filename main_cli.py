"""
Strategic Business Simulator - MCTS/Causal Graph Edition
========================================================
CLI Interface to run the simulation.
"""

import time
import sys
from typing import List

import random

from simulation_engine import SimulationEngine
from mcts import MCTSEngine
# from bet_sizing import StrategicGroup (Unused)

def print_header():
    print("\n" + "="*60)
    print("STRATEGIC BUSINESS SIMULATOR (MCTS + Causal Graph)")
    print("="*60)

def print_state(state, lagged_effects):
    print(f"\n[MONTH {state.month}] STATUS REPORT")
    print(f"-"*30)
    print(f"  Cash:       ${state.cash:,.0f}")
    print(f"  Customers:  {state.customers:,}")
    print(f"  CAC:        ${state.cac:.2f}")
    print(f"  ARPU:       ${state.arpu:.2f}")
    print(f"  Churn:      {state.churn_rate:.1%}")
    print(f"  Runway:     {state.runway:.1f} months")
    
    # Risk Indicators
    if state.market_saturation > 0.1:
        print(f"  WARNING: Market Saturation at {state.market_saturation:.1%}")
    if state.cultural_degradation > 0.1:
        print(f"  WARNING: Cultural Degradation at {state.cultural_degradation:.1%}")
        
    # Pending Effects
    if lagged_effects:
        print(f"\n  [!] {len(lagged_effects)} strategic effects pending...")
    print(f"-"*30)

def main():
    print_header()
    
    # Set seed for reproducibility (Reviewer Requirement)
    random.seed(42)
    
    # 1. Initialize Engines
    sim = SimulationEngine()
    mcts = MCTSEngine(sim)
    
    # 2. Setup Initial State
    state, effects = sim.get_initial_state()
    
    # 3. Main Loop
    while not sim.is_terminal(state):
        print_state(state, effects)
        
        print("\nThinking (Running MCTS)...")
        # Run MCTS to find best move
        start_time = time.time()
        best_move, survival_prob = mcts.run_search(state, effects, iterations=500)
        elapsed = time.time() - start_time
        
        print(f"Analysis Complete ({elapsed:.2f}s).")
        print(f"\nAI RECOMMENDATION: >> {best_move.name} <<")
        print(f"({best_move.description})")
        print(f"Survival Probability: {survival_prob:.1%}")
        
        # In a real game, user might choose. Here we auto-accept for the demo
        # or we could ask for input:
        # choice = input("Accept? [Y/n]: ")
        
        print(f"\nExecuting: {best_move.name}...")
        
        # Step simulation
        state, effects = sim.step(state, effects, best_move)
        
        # Pause for effect
        time.sleep(1)

    # 4. Final Results
    print("\n" + "="*60)
    print("SIMULATION ENDED")
    print("="*60)
    print_state(state, effects)
    
    if state.cash < 0:
        print("\n[FAILED] Company ran out of cash.")
    else:
        print("\n[SUCCESS] Survived 12 months.")

if __name__ == "__main__":
    main()
