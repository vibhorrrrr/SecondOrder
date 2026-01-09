from dataclasses import dataclass, asdict
from typing import Dict, Any

@dataclass
class BusinessState:
    """
    Represents the state of the business at a specific timestep.
    """
    cac: float
    ltv: float
    arpu: float
    burn: float
    cash: float
    revenue: float
    customers: int
    new_customers: int
    traffic: int
    ad_spend: float
    runway: float

    # Churn modeling (HP-1)
    churn_rate: float = 0.05  # Monthly churn rate (5% default)
    churned_customers: int = 0

    # Additional variables for tracking
    month: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BusinessState':
        return cls(**data)
