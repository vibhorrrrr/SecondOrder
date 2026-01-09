"""
Third-order effects application using Gemini with JSON schema validation.
"""
from business_state import BusinessState
from utils.gemini_client import call_gemini_with_schema
from utils.schemas import ThirdOrderModifiers


def build_third_order_prompt(state: BusinessState) -> str:
    """Builds the prompt for third-order effects analysis."""
    return f"""
You are a strategic business simulation engine.
Analyze the current business state and determine 3rd order effects (strategic emergent effects).

Current State:
{state.to_dict()}

Consider:
- Core business degradation
- ARPU drift
- Cultural/operational complexity
- Long-term risk
- Market response

Return the modifiers as JSON.
"""


def apply_third_order_effects_gemini(state: BusinessState) -> BusinessState:
    """
    Applies strategic emergent effects using Gemini with schema validation.
    
    Mutates and returns the state with third-order effects applied.
    """
    prompt = build_third_order_prompt(state)
    modifiers = call_gemini_with_schema(prompt, ThirdOrderModifiers)
    
    # Apply modifiers to state
    state.burn *= modifiers.burn_multiplier
    state.arpu += modifiers.ARPU_shift
    state.cac *= modifiers.CAC_drift
    state.traffic = int(state.traffic * modifiers.demand_adjustments)
    
    return state
