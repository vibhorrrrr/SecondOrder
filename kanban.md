# Predixen Financial Intelligence Core — Master Task Tracker

> **Scope**: Monte Carlo Simulator (Module B) — Causal Graph (Module A) is out of scope
> **PRD Reference**: `PRD — Predixen Financial Intelligence Core (Step 1 MVP).md`
> **Last Updated**: 2024-12-14

---

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Tasks | 26 |
| High Priority | 6 |
| Medium Priority | 10 |
| Low Priority | 10 |
| Completed | 12 |
| In Progress | 0 |
| Variables Implemented | 11/18 (61%) |
| Equations Implemented | 6/8 (75%) |

---

## HIGH PRIORITY ACTION ITEMS

These must be completed for PRD compliance. Ordered by implementation sequence.

### HP-1: Add Explicit Churn Modeling

**PRD Section**: B-3 (Churn & Cohort Logic)
**Status**: ✅ DONE
**Effort**: Medium

**What's Missing**:
- No `monthly_churn` or `churn_rate` variable
- No explicit churned user calculation
- Customer count only grows, never shrinks from churn

**Required Changes**:

1. **Add to `business_state.py`**:
   ```python
   churn_rate: float = 0.05  # Monthly churn rate (5% default)
   churned_customers: int = 0
   ```

2. **Add to `first_order.py`**:
   ```python
   # Churn calculation
   churned = int(state.customers * state.churn_rate)
   state.churned_customers = churned
   state.customers = state.customers + state.new_customers - churned
   ```

3. **Update LTV derivation**:
   ```python
   state.ltv = state.arpu / state.churn_rate  # Derived, not input
   ```

**Files Affected**: `business_state.py`, `first_order.py`, `second_order.py`
**Acceptance Criteria**:
- [x] `churn_rate` is a configurable input
- [x] `churned_customers` calculated each month
- [x] Customer count reflects churn subtraction
- [x] LTV derived from ARPU/churn_rate

---

### HP-2: Add Cohort-Specific Churn Logic

**PRD Section**: B-3
**Status**: ❌ TO DO
**Effort**: High
**Depends On**: HP-1

**What's Missing**:
- All customers treated identically
- No tracking of when customers were acquired
- No cohort-specific retention curves

**Required Changes**:

1. **Add cohort tracking structure**:
   ```python
   @dataclass
   class Cohort:
       month_acquired: int
       initial_size: int
       current_size: int
       churn_rate: float  # Can differ per cohort

   # In BusinessState:
   cohorts: List[Cohort] = field(default_factory=list)
   ```

2. **Update customer calculations**:
   ```python
   # Each month, add new cohort
   new_cohort = Cohort(month=state.month, initial_size=new_customers, ...)
   state.cohorts.append(new_cohort)

   # Apply churn to each cohort
   for cohort in state.cohorts:
       cohort.current_size = int(cohort.current_size * (1 - cohort.churn_rate))

   state.customers = sum(c.current_size for c in state.cohorts)
   ```

**Files Affected**: `business_state.py`, `first_order.py`
**Acceptance Criteria**:
- [ ] New customers each month form a distinct cohort
- [ ] Each cohort can have different churn rate
- [ ] Total customers = sum of all cohort sizes
- [ ] Cohort data exportable in simulation results

---

### HP-3: Add Trial-to-Paid Conversion

**PRD Section**: B-3
**Status**: ❌ TO DO
**Effort**: Medium
**Depends On**: HP-1

**What's Missing**:
- No free trial modeling
- No conversion funnel from trial → paid
- All acquired users immediately become paying

**Required Changes**:

1. **Add to `business_state.py`**:
   ```python
   trial_users: int = 0
   trial_conversion_rate: float = 0.20  # 20% trial→paid default
   trial_duration_months: int = 1
   ```

2. **Update acquisition flow**:
   ```python
   # New users enter trial first
   state.trial_users += new_customers

   # After trial_duration, convert or churn
   converting = int(trial_users_from_N_months_ago * trial_conversion_rate)
   state.customers += converting
   ```

**Files Affected**: `business_state.py`, `first_order.py`
**Acceptance Criteria**:
- [ ] New acquisitions enter trial pool
- [ ] Conversion happens after trial duration
- [ ] Only converted users counted in paying customers
- [ ] Trial users don't generate revenue

---

### HP-4: Add Realistic First-Order Stochasticity

**PRD Section**: B-8 (Monte Carlo Simulation)
**Status**: ✅ DONE
**Effort**: Medium

**What's Wrong**:
- First-order effects (acquisition, revenue, churn) are completely deterministic
- Only Gemini modifiers have ±5% noise (applied in `simulator.py`)
- P10/P50/P90 values are nearly identical because core business mechanics dominate
- Not a realistic Monte Carlo simulation!

**Current Noise Sources** (in `simulator.py:57-77`):
- burn_multiplier: ±5% noise
- ARPU_shift: ±5% noise
- CAC_drift: ±5% noise
- demand_adjustments: ±5% noise
- long_term_risk: probabilistic shock events

**Missing Noise Sources** (in `first_order.py`):
- Customer acquisition: `new_customers = ad_spend / CAC` (deterministic)
- Churn: `churned_customers = customers * churn_rate` (deterministic)
- Revenue: `revenue = customers * ARPU` (deterministic)

**Required Changes**:

1. **Add noise to `first_order.py`**:
   ```python
   import random

   def apply_first_order_effects(state: BusinessState) -> BusinessState:
       # Acquisition noise (±10% conversion variance)
       acquisition_noise = random.uniform(0.90, 1.10)
       state.new_customers = int((state.ad_spend / state.cac) * acquisition_noise)

       # Churn noise (±15% monthly variance - churn is volatile)
       churn_noise = random.uniform(0.85, 1.15)
       state.churned_customers = int(state.customers * state.churn_rate * churn_noise)

       # ARPU noise (±5% spending variance)
       arpu_noise = random.uniform(0.95, 1.05)
       state.revenue = state.customers * state.arpu * arpu_noise
   ```

2. **Optionally add seeded randomness for reproducibility**:
   ```python
   # In monte_carlo.py run_single_simulation():
   def run_single_simulation(..., run_seed: int = None):
       if run_seed is not None:
           random.seed(run_seed)
   ```

**Files Affected**: `first_order.py`, `monte_carlo.py`, `tests/test_stochasticity.py`
**Acceptance Criteria**:
- [x] P10/P50/P90 values show meaningful variance
- [x] Customer acquisition has ±10% noise
- [x] Churn has ±15% noise (monthly volatility)
- [x] Revenue has ±5% noise
- [x] Optional: seed parameter for reproducible runs

---

### HP-5: Add Constraint Validation

**PRD Section**: B-9 (Mathematical Integrity Validation)
**Status**: ✅ DONE
**Effort**: Medium

**What's Missing**:
- No validation that values stay sensible
- Cash can go negative without warning
- Customers could theoretically go negative
- No dimensional correctness checks

**Required Changes**:

1. **Create `validators.py`**:
   ```python
   class SimulationConstraintError(Exception):
       pass

   def validate_state(state: BusinessState) -> List[str]:
       violations = []
       if state.cash < 0:
           violations.append(f"Negative cash: {state.cash}")
       if state.customers < 0:
           violations.append(f"Negative customers: {state.customers}")
       if state.revenue < 0:
           violations.append(f"Negative revenue: {state.revenue}")
       if state.churn_rate < 0 or state.churn_rate > 1:
           violations.append(f"Invalid churn_rate: {state.churn_rate}")
       return violations

   def enforce_constraints(state: BusinessState):
       """Clamp values to valid ranges"""
       state.cash = max(0, state.cash)  # Or allow negative for debt?
       state.customers = max(0, state.customers)
       state.revenue = max(0, state.revenue)
   ```

2. **Call after each simulation step**:
   ```python
   # In simulator.py step():
   apply_first_order_effects(state)
   apply_second_order_effects(state)
   violations = validate_state(state)
   if violations:
       logger.warning(f"Constraint violations at month {state.month}: {violations}")
   enforce_constraints(state)
   ```

**Files Affected**: `validators.py`, `simulator.py`, `tests/test_validators.py`
**Acceptance Criteria**:
- [x] Validation runs after each step
- [x] Violations logged with details
- [x] Values clamped to valid ranges
- [ ] API response includes any violations (deferred - violations tracked in simulator)

---

### HP-6: Add Traceability System

**PRD Section**: Section 13 (Traceability & Explainability — MANDATORY)
**Status**: ❌ TO DO
**Effort**: High

**What's Missing**:
- No tracking of why values changed
- Can't explain which rule affected which variable
- No audit trail for enterprise trust

**Required Changes**:

1. **Create `traceability.py`**:
   ```python
   @dataclass
   class EffectTrace:
       variable: str
       old_value: float
       new_value: float
       effect_type: str  # "first_order", "second_order", "third_order"
       rule_name: str    # e.g., "cac_efficiency", "operational_overhead"
       month: int

   class TraceCollector:
       def __init__(self):
           self.traces: List[EffectTrace] = []

       def record(self, variable, old_val, new_val, effect_type, rule_name, month):
           self.traces.append(EffectTrace(...))

       def get_traces_for_variable(self, variable: str) -> List[EffectTrace]:
           return [t for t in self.traces if t.variable == variable]
   ```

2. **Instrument effect functions**:
   ```python
   # In second_order.py:
   def apply_second_order_effects(state, trace_collector=None):
       old_cac = state.cac
       if state.ad_spend > 50000:
           state.cac *= 0.95
           if trace_collector:
               trace_collector.record("cac", old_cac, state.cac,
                   "second_order", "cac_efficiency_high_spend", state.month)
   ```

3. **Include in API response**:
   ```python
   {
       "traces": [
           {"variable": "cac", "old": 120, "new": 114, "rule": "cac_efficiency_high_spend", "month": 3},
           ...
       ]
   }
   ```

**Files Affected**: New `traceability.py`, `first_order.py`, `second_order.py`, `third_order_gemini.py`, `monte_carlo.py`, `api.py`
**Acceptance Criteria**:
- [ ] Every state change records its cause
- [ ] Traces include: variable, old/new value, effect type, rule name, month
- [ ] API response includes full trace history
- [ ] Can reconstruct "why did X change?" from traces

---

## MEDIUM PRIORITY TASKS

| ID | Task | PRD Section | Files Affected | Notes |
|----|------|-------------|----------------|-------|
| MP-1 | Export equation system as JSON | Section 12 | New `equation_export.py`, `api.py` | Add `/equations` endpoint returning machine-readable equation definitions |
| MP-2 | Add variable typing metadata | B-1 | `business_state.py`, new `variable_types.py` | Tag each var as stock/flow, count/rate/currency |
| MP-3 | Decompose `burn` into components | B-5 | `business_state.py`, `first_order.py` | Split into `payroll`, `infra_cost`, `marketing_cost`, `platform_fees` |
| MP-4 | Add unit economics formulas | B-7 | `first_order.py` or new `unit_economics.py` | `LTV = ARPU/churn`, `payback = CAC/(ARPU×margin)`, `CAC:LTV ratio` |
| MP-5 | Add `activations` variable | A-3 | `business_state.py`, `first_order.py` | Funnel: installs → activations → paid |
| MP-6 | Add `paid_conversion_rate` variable | A-3 | `business_state.py`, `first_order.py` | Track conversion % explicitly |
| MP-7 | Expose seed parameter in API | B-8 | `api.py` | Allow reproducible simulations via API request |
| MP-8 | Return violations in API response | B-9 | `api.py`, `monte_carlo.py` | Complete HP-5: include constraint violations in response |
| MP-9 | Add multi-metric time series | B-8 | `monte_carlo.py` | Track revenue, customers, burn over time (not just cash) |
| MP-10 | Make noise parameters configurable | B-8 | `first_order.py`, `business_state.py` | Allow tuning ±10%/±15%/±5% noise ranges |

---

## LOW PRIORITY TASKS

| ID | Task | PRD Section | Notes |
|----|------|-------------|-------|
| LP-1 | Add `refunds` variable | A-3 | Revenue leakage: `net_revenue = gross - refunds` |
| LP-2 | Add `platform_fees` variable | A-3 | App Store fees (15-30%): `net = gross × (1 - platform_fee_rate)` |
| LP-3 | Add `payment_processing_fees` | A-3 | Stripe etc. (~2.9%): deduct from revenue |
| LP-4 | Add model versioning system | Section 14 | Version string in output, changelog tracking |
| LP-5 | Add geography support | Section 6 | Input param for geo-specific CAC/ARPU/churn |
| LP-6 | Add `/health` endpoint | Section 14 | Standard healthcheck for deployment monitoring |
| LP-7 | Add API input validation | Section 14 | Validate months > 0, num_runs > 0, positive values |
| LP-8 | Add scenario comparison endpoint | Section 14 | Compare multiple actions side-by-side in one request |
| LP-9 | Parallel simulation execution | B-8 | Use multiprocessing for MC runs (currently sequential) |
| LP-10 | Cache Gemini modifiers | Section 14 | Cache third-order modifiers for similar states |

---

## PRD Compliance Tracker

| Status | Task | PRD Section | Priority | Notes |
|--------|------|-------------|----------|-------|
| **DONE** | Add explicit `monthly_churn` variable | B-3 | High | HP-1 |
| **TO DO** | Add cohort-specific churn logic | B-3 | High | HP-2 |
| **TO DO** | Add trial-to-paid conversion churn | B-3 | High | HP-3 |
| **DONE** | Add realistic first-order stochasticity | B-8 | High | HP-4 |
| **DONE** | Add constraint validation | B-9 | High | HP-5 |
| **TO DO** | Add traceability system | Section 13 | High | HP-6 |
| **TO DO** | Export equation system as JSON | Section 12 | Medium | MP-1 |
| **TO DO** | Add variable typing metadata | B-1 | Medium | MP-2 |
| **TO DO** | Decompose `burn` into components | B-5 | Medium | MP-3 |
| **TO DO** | Add unit economics formulas | B-7 | Medium | MP-4 |
| **TO DO** | Add `activations` variable | A-3 | Medium | MP-5 |
| **TO DO** | Add `paid_conversion_rate` variable | A-3 | Medium | MP-6 |
| **TO DO** | Add `refunds` variable | A-3 | Low | LP-1 |
| **TO DO** | Add `platform_fees` variable | A-3 | Low | LP-2 |
| **TO DO** | Add `payment_processing_fees` variable | A-3 | Low | LP-3 |
| **TO DO** | Add model versioning system | Section 14 | Low | LP-4 |
| **TO DO** | Add geography support | Section 6 | Low | LP-5 |
| **TO DO** | Add `/health` endpoint | Section 14 | Low | LP-6 |
| **TO DO** | Add API input validation | Section 14 | Low | LP-7 |
| **TO DO** | Add scenario comparison endpoint | Section 14 | Low | LP-8 |
| **TO DO** | Parallel simulation execution | B-8 | Low | LP-9 |
| **TO DO** | Cache Gemini modifiers | Section 14 | Low | LP-10 |
| **TO DO** | Expose seed parameter in API | B-8 | Medium | MP-7 |
| **TO DO** | Return violations in API response | B-9 | Medium | MP-8 |
| **TO DO** | Add multi-metric time series | B-8 | Medium | MP-9 |
| **TO DO** | Make noise parameters configurable | B-8 | Medium | MP-10 |
| **DONE** | Monte Carlo engine (50+ parallel runs) | B-8 | — | `monte_carlo.py` |
| **DONE** | First-order effects (acquisition, revenue, cash) | B-2, B-4, B-6 | — | `first_order.py` |
| **DONE** | Second-order feedback loops | — | — | `second_order.py` |
| **DONE** | Third-order Gemini integration | — | — | `third_order_gemini.py` |
| **DONE** | API endpoints (`/simulate`, `/generate_nodes`) | Section 14 | — | `api.py` |
| **DONE** | P10/P50/P90 percentile calculations | — | — | `monte_carlo.py` |
| **DONE** | Survival probability calculation | — | — | `monte_carlo.py` |
| **DONE** | Modular agent architecture | Section 14 | — | Clean file separation |
| **DONE** | API-first design | Section 14 | — | FastAPI with CORS |

---

## Variable Coverage

| PRD Variable | Status | Current Mapping | Action Item |
|--------------|--------|-----------------|-------------|
| `ad_spend` | ✅ Done | `BusinessState.ad_spend` | — |
| `CAC` | ✅ Done | `BusinessState.cac` | — |
| `installs` | ✅ Done | `BusinessState.new_customers` | — |
| `activations` | ❌ To Do | — | MP-5 |
| `paid_conversion_rate` | ❌ To Do | — | MP-6 |
| `paid_users` | ✅ Done | `BusinessState.customers` | — |
| `monthly_churn` | ✅ Done | `BusinessState.churn_rate`, `BusinessState.churned_customers` | HP-1 |
| `ARPU` | ✅ Done | `BusinessState.arpu` | — |
| `MRR` | ✅ Done | `BusinessState.revenue` | — |
| `refunds` | ❌ To Do | — | LP-1 |
| `gross_revenue` | ✅ Done | `BusinessState.revenue` | — |
| `platform_fees` | ❌ To Do | — | LP-2 |
| `payment_processing_fees` | ❌ To Do | — | LP-3 |
| `payroll` | ❌ To Do | Bundled in `burn` | MP-3 |
| `infra_cost` | ❌ To Do | Bundled in `burn` | MP-3 |
| `marketing_cost` | ⚠️ Partial | `ad_spend` only | MP-3 |
| `burn` | ✅ Done | `BusinessState.burn` | — |
| `cash_balance` | ✅ Done | `BusinessState.cash` | — |

---

## Equation Coverage

| PRD Equation | Status | Location | Action Item |
|--------------|--------|----------|-------------|
| `installs_t = ad_spend_t / CAC_t` | ✅ Done | `first_order.py:7` | — |
| `paid_users_t = paid_users_t-1 + new - churned` | ✅ Done | `first_order.py:25` | HP-1 |
| `churned_users_t = paid_users_t × churn_rate_t` | ✅ Done | `first_order.py:22` | HP-1 |
| `MRR_t = paid_users_t × ARPU_t` | ✅ Done | `first_order.py:12` | — |
| `burn_t = payroll + infra + marketing + fees` | ❌ To Do | Single value | MP-3 |
| `cash_t+1 = cash_t + revenue_t - burn_t` | ✅ Done | `first_order.py:16` | — |
| `LTV = ARPU / churn_rate` | ✅ Done | `first_order.py:29` | HP-1 |
| `payback_period = CAC / (ARPU × gross_margin)` | ❌ To Do | — | MP-4 |

---

## Output Contract Compliance (Section 12)

| PRD Output Field | Status | Notes | Action Item |
|------------------|--------|-------|-------------|
| `state_variables` | ⚠️ Implicit | In code, not exported | MP-1 |
| `variable_types` | ❌ To Do | No stock/flow typing | MP-2 |
| `deterministic_identities` | ⚠️ Implicit | In code, not exported | MP-1 |
| `transition_functions` | ⚠️ Implicit | In code, not exported | MP-1 |
| `unit_economics_formulas` | ❌ To Do | — | MP-4 |
| `constraints` | ❌ To Do | — | HP-5 |

---

## Implementation Order (Recommended)

```
Phase 1: Core Churn (Week 1)
├── HP-1: Add monthly_churn variable
├── HP-4: Make simulation deterministic
└── HP-5: Add constraint validation

Phase 2: Advanced Churn (Week 2)
├── HP-2: Cohort-specific churn
└── HP-3: Trial-to-paid conversion

Phase 3: Observability (Week 3)
├── HP-6: Traceability system
├── MP-1: Equation export
└── MP-2: Variable typing

Phase 4: Financial Detail (Week 4)
├── MP-3: Burn decomposition
├── MP-4: Unit economics formulas
└── MP-5/MP-6: Funnel variables

Phase 5: Polish (Week 5)
└── LP-1 through LP-5: Revenue detail, versioning, geo
```

---

## Notes & Decisions

| Date | Note |
|------|------|
| 2024-12-14 | Initial kanban created from PRD analysis |
| 2024-12-14 | Scope clarified: MC simulator only, no causal graph (Module A) |
| 2024-12-14 | HP-1 (churn modeling) completed - added churn_rate and churned_customers |
| 2024-12-14 | HP-4 updated: Changed from "make deterministic" to "add stochasticity" - P10/P50/P90 identical because first_order.py lacks noise |
| 2024-12-14 | HP-4 (stochasticity) completed - added ±10% acquisition, ±15% churn, ±5% revenue noise + seed support |
| 2024-12-14 | HP-5 (constraint validation) completed - validators.py with validate_and_enforce, simulator integration |
| 2024-12-14 | Added MP-7 through MP-10: API reproducibility, violations response, multi-metric series, configurable noise |
| 2024-12-14 | Added LP-6 through LP-10: health endpoint, input validation, scenario comparison, parallel execution, caching |
| — | — |

---

## File Index

| File | Purpose | Needs Changes For |
|------|---------|-------------------|
| `business_state.py` | Core state dataclass | HP-2, HP-3, MP-3, MP-5, MP-6 |
| `first_order.py` | Direct accounting | HP-2, HP-3, MP-3, MP-4 |
| `second_order.py` | Feedback loops | HP-6 (tracing) |
| `third_order_gemini.py` | AI modifiers | HP-6 |
| `monte_carlo.py` | Simulation runner | HP-6 |
| `simulator.py` | Step orchestrator | HP-6 |
| `api.py` | REST endpoints | HP-6, MP-1 |
| `validators.py` | Constraint validation | ✅ Added for HP-5 |
| `traceability.py` | **NEW** | HP-6 |
| `equation_export.py` | **NEW** | MP-1 |
| `variable_types.py` | **NEW** | MP-2 |
| `tests/test_stochasticity.py` | Stochasticity tests | ✅ Added for HP-4 |
| `tests/test_validators.py` | Validator tests | ✅ Added for HP-5 |
