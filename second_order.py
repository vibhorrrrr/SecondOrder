from business_state import BusinessState

def apply_second_order_effects(state: BusinessState) -> BusinessState:
    """
    Applies mechanical indirect effects.
    Examples:
    - Higher ad spend -> CAC efficiency improvement (per prompt)
    - Increased customers -> higher burn (operational overhead)
    - High CAC -> lower LTV (proxy for conversion/retention impact)
    """
    
    # 1. Higher ad spend -> CAC efficiency improvement
    # Prompt says "efficiency improvement", so CAC goes DOWN as Ad Spend goes UP?
    # Or maybe it means "efficiency" as in "better tools"? 
    # Let's assume a small discount on CAC for high spend (economies of scale)
    # But usually it's the opposite (saturation). 
    # I will implement a slight improvement for now as requested.
    if state.ad_spend > 50000:
        state.cac *= 0.95 # 5% improvement
    elif state.ad_spend > 10000:
        state.cac *= 0.98 # 2% improvement
        
    # 2. Increased customers -> higher burn (operational overhead)
    # Simple model: $10 extra burn per customer
    operational_overhead = state.customers * 10
    state.burn += operational_overhead
    
    # 3. High CAC -> lower LTV
    # If CAC is very high, maybe we are acquiring lower quality users?
    if state.cac > 200: # Threshold
        state.ltv *= 0.95
        
    return state
