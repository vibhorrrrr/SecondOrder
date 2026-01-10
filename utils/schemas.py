"""
Pydantic schemas for Gemini API structured outputs.
These are used to enforce JSON schema validation on Gemini responses.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class ThirdOrderModifiers(BaseModel):
    """Third-order strategic effects returned by Gemini for simulation physics."""
    burn_multiplier: float = Field(
        description="Monthly burn rate multiplier (e.g., 1.01 for 1% monthly increase)"
    )
    ARPU_shift: float = Field(
        description="Monthly ARPU change in dollars (e.g., -0.1 for $0.10 decrease)"
    )
    CAC_drift: float = Field(
        description="Monthly CAC multiplier (e.g., 1.02 for 2% monthly increase)"
    )
    strategic_penalty: float = Field(
        description="Abstract strategic penalty score"
    )
    long_term_risk: float = Field(
        description="Probability of shock event (0-1)"
    )
    demand_adjustments: float = Field(
        description="Traffic/conversion multiplier"
    )


class StrategicAnalysis(BaseModel):
    """Recommendations, risks, and opportunities from Gemini analysis."""
    recommendations: List[str] = Field(
        description="Up to 5 actionable recommendations"
    )
    risks: List[str] = Field(
        description="Up to 5 identified risks"
    )
    opportunities: List[str] = Field(
        description="Up to 5 potential opportunities"
    )


class SuggestedShifts(BaseModel):
    """Parameter shifts suggested for a strategic decision."""
    ad_spend: Optional[float] = Field(default=None, description="New ad spend value")
    burn: Optional[float] = Field(default=None, description="Change in burn rate")
    cac: Optional[float] = Field(default=None, description="New CAC value")
    arpu: Optional[float] = Field(default=None, description="New ARPU value")
    traffic: Optional[float] = Field(default=None, description="New traffic value")


class StrategicDecision(BaseModel):
    """A single strategic decision option."""
    name: str = Field(description="Short name for the decision")
    description: str = Field(description="What this decision involves")
    probability: float = Field(description="Likelihood this is the best choice (0-1)")
    suggested_shifts: SuggestedShifts = Field(description="Parameter changes for this decision")
    impact: str = Field(description="Brief description of expected outcomes and risks")


class StrategicDecisions(BaseModel):
    """Container for multiple strategic decisions."""
    decisions: List[StrategicDecision] = Field(
        description="3-5 strategic decision options"
    )
