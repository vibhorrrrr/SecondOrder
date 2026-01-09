"""
Minimal Causal Graph Prototype
================================
This prototype validates the causal graph approach with:
1. Time-lagged edges
2. Monte Carlo decision sampling
3. Effect propagation and accumulation
"""

from dataclasses import dataclass, field, asdict
from typing import Callable, List, Dict, Any, Optional, Tuple
import copy
import random


# ============================================================================
# Data Structures
# ============================================================================

@dataclass
class BusinessState:
    """Simplified business state for prototype"""
    # Core metrics
    cash: float
    customers: int
    ad_spend: float
    cac: float
    arpu: float
    burn: float
    churn_rate: float
    
    # Derived metrics
    new_customers: int = 0
    revenue: float = 0.0
    runway: float = 0.0
    
    # Strategic state variables (created by causal graph)
    market_saturation: float = 0.0
    cultural_degradation: float = 0.0
    rapid_growth: float = 0.0
    
    month: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class LaggedEffect:
    """Represents an effect that will manifest in the future"""
    target_metric: str
    effect_value: float
    effect_type: str  # "multiplicative", "additive", "set"
    months_remaining: int
    source_path: List[str]  # For explainability
    description: str = ""


@dataclass
class CausalEdge:
    """Represents a causal relationship between metrics"""
    source: str
    target: str
    effect_fn: Callable[[BusinessState, float], float]
    lag_months: int = 0
    effect_type: str = "multiplicative"  # or "additive" or "set"
    threshold: Optional[float] = None
    description: str = ""


@dataclass
class CausalGraph:
    """The complete causal graph"""
    edges: List[CausalEdge] = field(default_factory=list)
    
    def add_edge(self, edge: CausalEdge):
        self.edges.append(edge)


# ============================================================================
# Static Causal Graph Definition
# ============================================================================

def build_prototype_graph() -> CausalGraph:
    """
    Builds a minimal causal graph with examples of all three orders.
    """
    graph = CausalGraph()
    
    # ========== FIRST ORDER (Direct, Immediate) ==========
    
    graph.add_edge(CausalEdge(
        source="ad_spend",
        target="new_customers",
        effect_fn=lambda state, ad_spend: int(ad_spend / state.cac),
        lag_months=0,
        effect_type="set",
        description="Ad spend directly acquires customers (1st order)"
    ))
    
    # ========== SECOND ORDER (Indirect, Immediate) ==========
    
    graph.add_edge(CausalEdge(
        source="new_customers",
        target="burn",
        effect_fn=lambda state, new_cust: new_cust * 10,  # $10 ops cost per customer
        lag_months=0,
        effect_type="additive",
        description="More customers increase burn (2nd order)"
    ))
    
    graph.add_edge(CausalEdge(
        source="ad_spend",
        target="cac",
        effect_fn=lambda state, ad_spend: 0.95,  # 5% improvement
        lag_months=0,
        effect_type="multiplicative",
        threshold=50000,
        description="High ad spend improves CAC efficiency (2nd order)"
    ))
    
    # ========== THIRD ORDER (Strategic, Time-Lagged) ==========
    
    graph.add_edge(CausalEdge(
        source="ad_spend",
        target="market_saturation",
        effect_fn=lambda state, ad_spend: min(ad_spend / 100000, 1.0),  # 0-1 scale
        lag_months=1,  # Takes 1 month to manifest
        effect_type="set",
        description="High ad spend saturates market (3rd order, lag=1)"
    ))
    
    graph.add_edge(CausalEdge(
        source="market_saturation",
        target="cac",
        effect_fn=lambda state, saturation: 1 + (saturation * 0.3),  # Up to 30% increase
        lag_months=2,  # Takes 2 more months after saturation
        effect_type="multiplicative",
        threshold=0.3,  # Only if saturation > 30%
        description="Market saturation increases CAC (3rd order, lag=2)"
    ))
    
    graph.add_edge(CausalEdge(
        source="market_saturation",
        target="arpu",
        effect_fn=lambda state, saturation: 1 - (saturation * 0.15),  # Up to 15% decrease
        lag_months=2,
        effect_type="multiplicative",
        threshold=0.3,
        description="Market saturation reduces ARPU (3rd order, lag=2)"
    ))
    
    graph.add_edge(CausalEdge(
        source="customers",
        target="rapid_growth",
        effect_fn=lambda state, customers: max(0, (customers - state.customers) / max(state.customers, 1)),
        lag_months=0,
        effect_type="set",
        threshold=0.2,  # 20% growth
        description="Detect rapid growth (3rd order trigger)"
    ))
    
    graph.add_edge(CausalEdge(
        source="rapid_growth",
        target="cultural_degradation",
        effect_fn=lambda state, growth: growth * 0.5,
        lag_months=3,  # Takes 3 months for culture to degrade
        effect_type="set",
        description="Rapid growth degrades culture (3rd order, lag=3)"
    ))
    
    graph.add_edge(CausalEdge(
        source="cultural_degradation",
        target="churn_rate",
        effect_fn=lambda state, degradation: 1 + degradation,
        lag_months=2,  # Takes 2 more months to impact churn
        effect_type="multiplicative",
        threshold=0.1,
        description="Cultural degradation increases churn (3rd order, lag=2)"
    ))
    
    return graph


# ============================================================================
# Propagation Engine
# ============================================================================

def apply_effect(state: BusinessState, effect: LaggedEffect):
    """Apply a lagged effect to the state"""
    current_value = getattr(state, effect.target_metric, 0)
    
    if effect.effect_type == "multiplicative":
        new_value = current_value * effect.effect_value
    elif effect.effect_type == "additive":
        new_value = current_value + effect.effect_value
    elif effect.effect_type == "set":
        new_value = effect.effect_value
    else:
        raise ValueError(f"Unknown effect type: {effect.effect_type}")
    
    setattr(state, effect.target_metric, new_value)


def propagate_effects(
    state: BusinessState,
    graph: CausalGraph,
    lagged_effects_queue: List[LaggedEffect]
) -> Tuple[BusinessState, List[LaggedEffect], List[str]]:
    """
    Propagates effects through the causal graph.
    
    Returns:
        - Updated state
        - Updated lagged effects queue
        - List of effect descriptions (for logging)
    """
    effect_log = []
    
    # 1. Apply lagged effects that are due this month
    effects_to_apply = [e for e in lagged_effects_queue if e.months_remaining == 0]
    for effect in effects_to_apply:
        apply_effect(state, effect)
        effect_log.append(f"  Applied: {effect.description} ({' -> '.join(effect.source_path)})")
    
    # 2. Decrement remaining months for all lagged effects
    lagged_effects_queue = [
        LaggedEffect(
            target_metric=e.target_metric,
            effect_value=e.effect_value,
            effect_type=e.effect_type,
            months_remaining=e.months_remaining - 1,
            source_path=e.source_path,
            description=e.description
        )
        for e in lagged_effects_queue
        if e.months_remaining > 0
    ]
    
    # 3. Calculate new effects from current state
    for edge in graph.edges:
        # Get source value
        source_value = getattr(state, edge.source, 0)
        
        # Check threshold
        if edge.threshold is not None and source_value < edge.threshold:
            continue
        
        # Calculate effect
        effect_value = edge.effect_fn(state, source_value)
        
        # Skip if effect is negligible
        if edge.effect_type == "set" and effect_value == 0:
            continue
        if edge.effect_type == "multiplicative" and abs(effect_value - 1.0) < 0.001:
            continue
        if edge.effect_type == "additive" and abs(effect_value) < 0.01:
            continue
        
        # Create lagged effect or apply immediately
        if edge.lag_months > 0:
            lagged_effects_queue.append(
                LaggedEffect(
                    target_metric=edge.target,
                    effect_value=effect_value,
                    effect_type=edge.effect_type,
                    months_remaining=edge.lag_months,
                    source_path=[edge.source, edge.target],
                    description=edge.description
                )
            )
            effect_log.append(f"  Queued (lag={edge.lag_months}): {edge.description}")
        else:
            # Apply immediately
            apply_effect(state, LaggedEffect(
                target_metric=edge.target,
                effect_value=effect_value,
                effect_type=edge.effect_type,
                months_remaining=0,
                source_path=[edge.source, edge.target],
                description=edge.description
            ))
            effect_log.append(f"  Immediate: {edge.description}")
    
    return state, lagged_effects_queue, effect_log


# ============================================================================
# Basic Financial Calculations
# ============================================================================

def calculate_basic_financials(state: BusinessState) -> BusinessState:
    """Calculate basic financial metrics (revenue, cash, runway)"""
    # Revenue from existing customers
    state.revenue = state.customers * state.arpu
    
    # Update cash
    state.cash = state.cash + state.revenue - state.burn - state.ad_spend
    
    # Calculate runway
    total_monthly_spend = state.burn + state.ad_spend
    if total_monthly_spend > 0:
        state.runway = state.cash / total_monthly_spend
    else:
        state.runway = 999.0
    
    # Apply churn
    churned = int(state.customers * state.churn_rate)
    state.customers = max(0, state.customers - churned + state.new_customers)
    
    return state


# ============================================================================
# Monte Carlo Simulator
# ============================================================================

def sample_random_decision(state: BusinessState) -> Dict[str, float]:
    """Sample a random decision (ad spend)"""
    # Random ad spend between $0 and $100k
    ad_spend = random.uniform(0, 100000)
    return {"ad_spend": ad_spend}


def run_single_simulation(
    initial_state: BusinessState,
    graph: CausalGraph,
    months: int,
    verbose: bool = False
) -> List[Dict]:
    """
    Run a single Monte Carlo simulation.
    
    Returns:
        List of monthly states with decisions and effects
    """
    state = copy.deepcopy(initial_state)
    lagged_effects_queue = []
    trajectory = []
    
    for month in range(months):
        state.month = month
        
        if verbose:
            print(f"\n{'='*60}")
            print(f"MONTH {month}")
            print(f"{'='*60}")
        
        # 1. Sample random decision
        decision = sample_random_decision(state)
        state.ad_spend = decision['ad_spend']
        
        if verbose:
            print(f"Decision: ad_spend = ${state.ad_spend:,.0f}")
            print(f"\nCausal Effects:")
        
        # 2. Propagate through causal graph
        state, lagged_effects_queue, effect_log = propagate_effects(
            state, graph, lagged_effects_queue
        )
        
        if verbose:
            for log in effect_log:
                print(log)
        
        # 3. Calculate basic financials
        state = calculate_basic_financials(state)
        
        # 4. Record trajectory
        trajectory.append({
            'month': month,
            'decision': decision,
            'state': state.to_dict(),
            'active_lagged_effects': len(lagged_effects_queue),
            'effect_log': effect_log
        })
        
        if verbose:
            print(f"\nState Summary:")
            print(f"  Customers: {state.customers:,}")
            print(f"  Cash: ${state.cash:,.0f}")
            print(f"  CAC: ${state.cac:.2f}")
            print(f"  ARPU: ${state.arpu:.2f}")
            print(f"  Churn Rate: {state.churn_rate:.1%}")
            print(f"  Market Saturation: {state.market_saturation:.2f}")
            print(f"  Cultural Degradation: {state.cultural_degradation:.2f}")
            print(f"  Active Lagged Effects: {len(lagged_effects_queue)}")
    
    return trajectory


# ============================================================================
# Main Test
# ============================================================================

if __name__ == "__main__":
    print("="*60)
    print("CAUSAL GRAPH PROTOTYPE - VALIDATION TEST")
    print("="*60)
    
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
    
    # Build causal graph
    graph = build_prototype_graph()
    
    print(f"\nCausal Graph: {len(graph.edges)} edges defined")
    print("\nEdge Summary:")
    for i, edge in enumerate(graph.edges, 1):
        lag_str = f"lag={edge.lag_months}" if edge.lag_months > 0 else "immediate"
        threshold_str = f", threshold={edge.threshold}" if edge.threshold else ""
        print(f"  {i}. {edge.source} -> {edge.target} ({lag_str}{threshold_str})")
    
    # Run simulation
    print("\n" + "="*60)
    print("Running 6-month simulation...")
    print("="*60)
    
    trajectory = run_single_simulation(
        initial_state=initial_state,
        graph=graph,
        months=6,
        verbose=True
    )
    
    # Summary
    print("\n" + "="*60)
    print("SIMULATION SUMMARY")
    print("="*60)
    
    final_state = trajectory[-1]['state']
    print(f"\nInitial -> Final:")
    print(f"  Customers: {initial_state.customers:,} -> {final_state['customers']:,}")
    print(f"  Cash: ${initial_state.cash:,.0f} -> ${final_state['cash']:,.0f}")
    print(f"  CAC: ${initial_state.cac:.2f} -> ${final_state['cac']:.2f}")
    print(f"  ARPU: ${initial_state.arpu:.2f} -> ${final_state['arpu']:.2f}")
    print(f"  Churn Rate: {initial_state.churn_rate:.1%} -> {final_state['churn_rate']:.1%}")
    
    print("\n[OK] Prototype validation complete!")
