import copy
import logging
import random
from typing import Dict, Any, List, Optional
from business_state import BusinessState
from first_order import apply_first_order_effects
from second_order import apply_second_order_effects
from third_order_gemini import apply_third_order_effects_gemini
from validators import validate_and_enforce, ValidationResult, ConstraintViolation

logger = logging.getLogger(__name__)

class BusinessSimulator:
    def __init__(self):
        self.violations: List[ConstraintViolation] = []

    def step(
        self,
        state: BusinessState,
        action_modifiers: Optional[Dict[str, Any]] = None,
        gemini_modifiers: Optional[Dict[str, Any]] = None,
        validate: bool = True
    ) -> BusinessState:
        """
        Advances the simulation by one month.

        Args:
            state: Current BusinessState.
            action_modifiers: Dict of changes to state variables (e.g. {'ad_spend': 50000}).
            gemini_modifiers: Cached/Pre-calculated Gemini modifiers for 3rd order effects.
                              If None, we might skip or call Gemini (but for MC we want to pass them).
            validate: Whether to validate and enforce constraints (HP-5). Default True.
        """
        new_state = copy.deepcopy(state)
        new_state.month += 1
        
        # Apply Action (update parameters)
        if action_modifiers:
            for k, v in action_modifiers.items():
                if hasattr(new_state, k):
                    setattr(new_state, k, v)
        
        # 1. First Order
        new_state = apply_first_order_effects(new_state)
        
        # 2. Second Order
        new_state = apply_second_order_effects(new_state)
        
        # 3. Third Order (Gemini)
        # If modifiers are passed, apply them deterministically or stochastically here.
        # If not passed, we could call the API, but for efficiency in MC, we expect them passed.
        # However, the prompt says "apply third-order (Gemini)" inside the loop.
        # To support the "Gemini = reasoning" requirement, we'll assume the modifiers 
        # define the *trends* and we apply them here.
        
        if gemini_modifiers:
            self._apply_gemini_modifiers(new_state, gemini_modifiers)

        # 4. Validate and enforce constraints (HP-5)
        if validate:
            new_state, validation_result = validate_and_enforce(new_state, log_violations=True)
            self.violations.extend(validation_result.violations)

        return new_state

    def _apply_gemini_modifiers(self, state: BusinessState, modifiers: Dict[str, Any]):
        """
        Applies the structured modifiers from Gemini.
        """
        # Apply stochastic randomness if requested by prompt "apply stochastic randomness"
        # We can add small noise to the multipliers
        
        noise = lambda: random.uniform(0.95, 1.05) # +/- 5% noise
        
        if "burn_multiplier" in modifiers:
            state.burn *= (float(modifiers["burn_multiplier"]) * noise())
            
        if "ARPU_shift" in modifiers:
            state.arpu += (float(modifiers["ARPU_shift"]) * noise())
            
        if "CAC_drift" in modifiers:
            state.cac *= (float(modifiers["CAC_drift"]) * noise())
            
        if "demand_adjustments" in modifiers:
            state.traffic = int(state.traffic * float(modifiers["demand_adjustments"]) * noise())
            
        # Strategic penalty / risk could trigger a "shock" event
        if "long_term_risk" in modifiers:
            risk_prob = float(modifiers["long_term_risk"])
            if random.random() < risk_prob * 0.1: # Small monthly chance if risk is high
                # Shock event
                state.revenue *= 0.8
                state.traffic = int(state.traffic * 0.8)

    def get_violations(self) -> List[ConstraintViolation]:
        """Returns all constraint violations recorded during simulation."""
        return self.violations

    def clear_violations(self):
        """Clears the recorded violations. Call before starting a new simulation run."""
        self.violations = []

    def has_violations(self) -> bool:
        """Returns True if any constraint violations were recorded."""
        return len(self.violations) > 0
