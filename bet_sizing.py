"""
Bet Sizing Logic
================
Handles the discretization of continuous variables into strategic groups.
Implements 'Max Coverage' sampling by forcing uniform probability across groups.
Implements 'Probabilistic Priors' to attach downstream outcome distributions to bets.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Dict
import random
import itertools
import math

# ============================================================================
# Prior Distribution Logic
# ============================================================================

@dataclass
class PriorDistribution:
    """Defines the shape of the outcome distribution"""
    dist_type: str  # "log-normal", "sales-normal" (clipped), "fat-tailed"
    mean_multiplier: float  # Multiplier on the baseline metric (e.g. 1.2x CAC)
    variance_sigma: float   # Variance/Risk parameter (sigma for log-normal)
    
    def sample_multiplier(self) -> float:
        """Sample a multiplier from the distribution"""
        if self.dist_type == "deterministic":
            return self.mean_multiplier
            
        elif self.dist_type == "log-normal":
            # Log-normal: Good for things that can't be negative (CAC, Price)
            # mu parameter needs to be adjusted so that the *expected value* matches mean_multiplier
            # E[X] = exp(mu + sigma^2/2) => mu = ln(E[X]) - sigma^2/2
            mu = math.log(self.mean_multiplier) - (self.variance_sigma**2 / 2)
            return random.lognormvariate(mu, self.variance_sigma)
            
        elif self.dist_type == "fat-tailed":
            # Simulating fat tails using a mix of log-normal and occasional extreme outliers
            # Or just a high-sigma log-normal for MVP simplicity with occasional boost
            basis = self.sample_log_normal(self.mean_multiplier, self.variance_sigma)
            # 5% chance of a "Black Swan" event (extreme failure/variance)
            if random.random() < 0.05:
                return basis * random.uniform(1.5, 3.0) # Disaster/Extreme scenario
            return basis
            
        else:
            return self.mean_multiplier

    def sample_log_normal(self, mean: float, sigma: float) -> float:
        mu = math.log(mean) - (sigma**2 / 2)
        return random.lognormvariate(mu, sigma)

@dataclass
class Prior:
    """Attaches a distribution to a specific downstream variable"""
    target_variable: str    # e.g. "cac", "conversion_rate"
    distribution: PriorDistribution

@dataclass
class StrategicGroup:
    """Represents a discrete strategic option (e.g., 'Aggressive Spend')"""
    name: str              # e.g., "Aggressive"
    min_value: float       # e.g., 50000
    max_value: float       # e.g., 100000
    description: str = ""
    priors: List[Prior] = field(default_factory=list) # Downstream consequences

    def sample(self) -> float:
        """Sample a specific value from this group"""
        return random.uniform(self.min_value, self.max_value)

@dataclass
class MonthlyPolicy:
    """
    Represents a complete set of strategic decisions for a month.
    Combines choices across multiple dimensions (e.g., Spend + Price).
    """
    name: str  # Generated name, e.g., "Aggressive Spend / Premium Price"
    decisions: Dict[str, StrategicGroup]
    
    @property
    def description(self) -> str:
        """Combine descriptions of all decisions"""
        return " + ".join([g.description for g in self.decisions.values()])
    
    def __repr__(self):
        return self.name

class Discretizer:
    """Manages the mapping between variables and their strategic groups"""
    
    def __init__(self):
        self.variables: Dict[str, List[StrategicGroup]] = {}

    def add_variable(self, name: str, groups: List[StrategicGroup]):
        """Define groups for a specific variable (e.g., 'ad_spend')"""
        self.variables[name] = groups

    def get_groups(self, variable_name: str) -> List[StrategicGroup]:
        """Get all defined groups for a variable"""
        if variable_name not in self.variables:
            raise ValueError(f"Variable '{variable_name}' not defined")
        return list(self.variables[variable_name])

    def generate_all_policies(self) -> List[MonthlyPolicy]:
        """
        Generates the Cartesian product of all defined variable groups.
        Returns a list of all possible MonthlyPolicy combinations.
        """
        # 1. Get all variables and their groups
        var_names = list(self.variables.keys())
        list_of_group_lists = [self.variables[name] for name in var_names]
        
        # 2. Generate Cartesian Product
        combinations = list(itertools.product(*list_of_group_lists))
        
        policies = []
        for combo in combinations:
            decisions_map = {}
            name_parts = []
            
            for i, group in enumerate(combo):
                var_name = var_names[i]
                decisions_map[var_name] = group
                name_parts.append(group.name) 
            
            full_name = " + ".join(name_parts)
            policies.append(MonthlyPolicy(name=full_name, decisions=decisions_map))
            
        return policies

# ============================================================================
# Default Configuration
# ============================================================================

def create_default_discretizer() -> Discretizer:
    """Creates the standard discretizer configuration for the simulation"""
    disc = Discretizer()
    
    # 1. Ad Spend Configuration (Absolute Values) + PRIORS (CAC Impact)
    # Spec:
    # $0: N/A
    # $10k: 0.9x Mean, Low Var (Log-normal)
    # $25k: 1.0x Mean, Low Var (Log-normal)
    # $50k: 1.2x Mean, Medium Var (Log-normal)
    # $80k: 1.4x Mean, High Var (Fat-tailed)
    
    pause = StrategicGroup("Pause", 0, 0, "Stop spending")
    
    probe = StrategicGroup("Probe", 10000, 10000, "Test channels", priors=[
        Prior("cac", PriorDistribution("log-normal", 0.9, 0.05)) # Low volatility
    ])
    
    grow = StrategicGroup("Grow", 25000, 25000, "Scale up", priors=[
        Prior("cac", PriorDistribution("log-normal", 1.0, 0.10))
    ])
    
    aggressive = StrategicGroup("Aggressive", 50000, 50000, "Market share", priors=[
        Prior("cac", PriorDistribution("log-normal", 1.2, 0.20)) # Higher volatility
    ])
    
    blitz = StrategicGroup("Blitz", 80000, 80000, "Dominate", priors=[
        Prior("cac", PriorDistribution("fat-tailed", 1.4, 0.40)) # Very high risk
    ])

    disc.add_variable("ad_spend", [pause, probe, grow, aggressive, blitz])

    # 2. Pricing Strategy (ARPU) (Absolute Values) + PRIORS (Conversion Impact)
    # Spec:
    # $20: 1.25x Mean, Low Var
    # $40: 1.0x Mean, Low Var
    # $60: 0.85x Mean, Medium Var
    # $80: 0.65x Mean, High Var
    # $120: 0.4x Mean, Very High Var (Fat-tailed)
    
    economy = StrategicGroup("Economy", 20, 20, "Mass market", priors=[
        Prior("conversion_rate", PriorDistribution("log-normal", 1.25, 0.05))
    ])
    
    standard = StrategicGroup("Standard", 40, 40, "Market entry", priors=[
        Prior("conversion_rate", PriorDistribution("log-normal", 1.0, 0.10))
    ])
    
    plus = StrategicGroup("Plus", 60, 60, "Upsell", priors=[
        Prior("conversion_rate", PriorDistribution("log-normal", 0.85, 0.15))
    ])
    
    premium = StrategicGroup("Premium", 80, 80, "High value", priors=[
        Prior("conversion_rate", PriorDistribution("log-normal", 0.65, 0.25))
    ])
    
    elite = StrategicGroup("Elite", 120, 120, "Niche/Enterprise", priors=[
        Prior("conversion_rate", PriorDistribution("fat-tailed", 0.40, 0.50))
    ])

    disc.add_variable("arpu", [economy, standard, plus, premium, elite])
    
    return disc

if __name__ == "__main__":
    disc = create_default_discretizer()
    print("Testing Prior Sampling:")
    
    # Test Blitz CAC
    blitz_group = disc.get_groups("ad_spend")[-1]   # Blitz
    print(f"\n[Blitz Spend] Expected Mean 1.4x, High Variance")
    samples = []
    prior = blitz_group.priors[0] # CAC prior
    for _ in range(10):
        val = prior.distribution.sample_multiplier()
        samples.append(val)
        print(f"  CAC Multiplier: {val:.2f}x")
    print(f"  > Avg: {sum(samples)/len(samples):.2f}x")
    
    # Test Elite Conversion
    elite_group = disc.get_groups("arpu")[-1] # Elite
    print(f"\n[Elite Price] Expected Mean 0.4x, Very High Variance")
    samples = []
    prior = elite_group.priors[0]
    for _ in range(10):
        val = prior.distribution.sample_multiplier()
        samples.append(val)
        print(f"  Conv Multiplier: {val:.2f}x")
    print(f"  > Avg: {sum(samples)/len(samples):.2f}x")
