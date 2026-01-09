"""
Strategic decision node generation using Gemini with JSON schema validation.
"""
from typing import List, Dict, Any

from business_state import BusinessState
from utils.gemini_client import call_gemini_with_schema
from utils.schemas import StrategicDecisions


def build_node_generation_prompt(state: BusinessState) -> str:
    """Builds the prompt for generating strategic decision nodes."""
    return f"""
You are a strategic business simulation engine analyzing a SaaS business.

Current Business State:
- Cash: ${state.cash:,.0f}
- Monthly Burn: ${state.burn:,.0f}
- Monthly Revenue: ${state.revenue:,.0f}
- Runway: {state.runway:.1f} months
- Customers: {state.customers}
- CAC (Customer Acquisition Cost): ${state.cac:,.0f}
- ARPU (Average Revenue Per User): ${state.arpu:,.0f}
- LTV (Lifetime Value): ${state.ltv:,.0f}
- Ad Spend: ${state.ad_spend:,.0f}

Generate 3-5 strategic decisions that this business could make. For each decision, consider:
1. **First Order Effects**: Direct, immediate impacts
2. **Second Order Effects**: System-level feedback loops
3. **Third Order Effects**: Strategic, emergent consequences

Ensure:
- Probabilities sum to approximately 1.0
- suggested_shifts contains actual numeric values for parameters like ad_spend, burn, cac, arpu, etc.
- Decisions are realistic and actionable

Return as JSON.
"""


def generate_child_nodes(state: BusinessState) -> List[Dict[str, Any]]:
    """
    Generates 3-5 child decisions using Gemini with schema validation.
    
    Returns:
        List of decision dicts with keys: name, description, probability, suggested_shifts, impact
    """
    prompt = build_node_generation_prompt(state)
    result = call_gemini_with_schema(prompt, StrategicDecisions)
    
    # Convert Pydantic models to dicts, filtering out None values from suggested_shifts
    decisions = []
    for decision in result.decisions:
        shifts = {k: v for k, v in decision.suggested_shifts.model_dump().items() if v is not None}
        decisions.append({
            "name": decision.name,
            "description": decision.description,
            "probability": decision.probability,
            "suggested_shifts": shifts,
            "impact": decision.impact,
        })
    
    return decisions
