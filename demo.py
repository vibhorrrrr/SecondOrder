import os
import sys
import json

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from business_simulator.business_state import BusinessState
from business_simulator.monte_carlo import run_monte_carlo

def main():
    print("--- Business Simulation Engine Demo ---")
    
    # Check for API Key
    if not os.environ.get("GOOGLE_API_KEY"):
        print("ERROR: GOOGLE_API_KEY environment variable not set.")
        return

    # Initialize State
    initial_state = BusinessState(
        cac=120.0,
        ltv=600.0,
        arpu=50.0,
        burn=25000.0,
        cash=150000.0,
        revenue=5000.0,
        customers=100,
        new_customers=10,
        traffic=2000,
        ad_spend=15000.0,
        runway=6.0
    )
    
    print("\nInitial State:")
    print(json.dumps(initial_state.to_dict(), indent=2))
    
    action = {"ad_spend": 25000.0}
    print(f"\nProposed Action: Increase Ad Spend to ${action['ad_spend']}")
    
    print("\nRunning Monte Carlo Simulation (12 months, 20 runs)...")
    try:
        results = run_monte_carlo(initial_state, action, months=12, num_runs=20)
    except Exception as e:
        print(f"\nSimulation Failed: {e}")
        return

    print("\n--- Results ---")
    print(f"Survival Probability: {results['survival_probability'] * 100:.1f}%")
    print(f"Cash P10 (Pessimistic): ${results['p10']:,.2f}")
    print(f"Cash P50 (Median):      ${results['p50']:,.2f}")
    print(f"Cash P90 (Optimistic):  ${results['p90']:,.2f}")
    
    print("\nGemini Strategic Modifiers (3rd Order Effects):")
    print(json.dumps(results.get('gemini_modifiers', {}), indent=2))

if __name__ == "__main__":
    main()
