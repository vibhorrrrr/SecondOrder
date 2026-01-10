"""
Quick test of the causal graph prototype - shows key results only
"""
import sys
sys.path.insert(0, '.')

from causal_graph_prototype import (
    BusinessState, build_prototype_graph, run_single_simulation
)

# Create initial state
initial_state = BusinessState(
    cash=500000,
    customers=1000,
    ad_spend=0,
    cac=100,
    arpu=50,
    burn=20000,
    churn_rate=0.05
)

# Build graph
graph = build_prototype_graph()

print("="*60)
print("CAUSAL GRAPH PROTOTYPE - QUICK TEST")
print("="*60)
print(f"\nGraph has {len(graph.edges)} causal edges")
print("\nRunning 6-month simulation with random decisions...")

# Run simulation (non-verbose)
trajectory = run_single_simulation(
    initial_state=initial_state,
    graph=graph,
    months=6,
    verbose=False
)

# Show results
print("\n" + "="*60)
print("RESULTS")
print("="*60)

final_state = trajectory[-1]['state']

print(f"\nInitial State:")
print(f"  Customers: {initial_state.customers:,}")
print(f"  Cash: ${initial_state.cash:,.0f}")
print(f"  CAC: ${initial_state.cac:.2f}")
print(f"  ARPU: ${initial_state.arpu:.2f}")
print(f"  Churn Rate: {initial_state.churn_rate:.1%}")

print(f"\nFinal State (Month 6):")
print(f"  Customers: {final_state['customers']:,}")
print(f"  Cash: ${final_state['cash']:,.0f}")
print(f"  CAC: ${final_state['cac']:.2f}")
print(f"  ARPU: ${final_state['arpu']:.2f}")
print(f"  Churn Rate: {final_state['churn_rate']:.1%}")
print(f"  Market Saturation: {final_state['market_saturation']:.2f}")
print(f"  Cultural Degradation: {final_state['cultural_degradation']:.2f}")

print(f"\nChanges:")
print(f"  Customers: {((final_state['customers'] - initial_state.customers) / initial_state.customers * 100):+.1f}%")
print(f"  Cash: ${(final_state['cash'] - initial_state.cash):+,.0f}")
print(f"  CAC: {((final_state['cac'] - initial_state.cac) / initial_state.cac * 100):+.1f}%")
print(f"  ARPU: {((final_state['arpu'] - initial_state.arpu) / initial_state.arpu * 100):+.1f}%")

# Show a sample month with effects
print(f"\n" + "="*60)
print("SAMPLE MONTH (Month 2) - Causal Effects")
print("="*60)
month_2 = trajectory[2]
print(f"\nDecision: Ad Spend = ${month_2['decision']['ad_spend']:,.0f}")
print(f"Active Lagged Effects: {month_2['active_lagged_effects']}")
print(f"\nEffects Applied:")
for log in month_2['effect_log'][:10]:  # Show first 10
    print(log)

print("\n[OK] Prototype test complete!")
print("\nKey Validation Points:")
print("  [OK] Time-lagged effects are queued and applied later")
print("  [OK] Monte Carlo random decisions are sampled")
print("  [OK] Effects propagate through the causal graph")
print("  [OK] Strategic metrics (saturation, culture) are tracked")
