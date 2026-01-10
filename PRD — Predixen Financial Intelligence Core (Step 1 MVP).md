# **PRD — Predixen Financial Intelligence Core (Step 1 MVP)**

**Industry Focus: Consumer Subscription (B2C Subscriptions)**  
 **Examples:** Streaming, Mobile Apps, Digital Content, Consumer SaaS-like Subscriptions  
 **Reference Class:** Netflix, Spotify, Duolingo, Calm, Headspace, Substack, Peloton Digital

---

## **1\. PURPOSE OF THIS PHASE**

Build the **first functional core** of Predixen that converts a **natural-language founder question** into a:

* **Causally complete**

* **Second- and third-order aware**

* **Deterministic financial equation system**

* **Consumer-subscription-specific**

This phase **does NOT run simulations**.  
 It only produces a **validated financial system model** ready for future simulation.

---

## **2\. EXPLICIT SCOPE (IN)**

This version **must only do the following**:

1. Interpret a B2C subscription decision

2. Identify:

   * All first-order drivers

   * Hidden variables

   * Second- and third-order effects

3. Construct:

   * A causal graph

   * A ranked variable set

4. Compile:

   * Deterministic revenue, cost, cohort, churn, and cash-flow equations

5. Output:

   * A machine-readable system of equations

   * With full traceability

---

## **3\. EXPLICIT OUT-OF-SCOPE (NOT BUILD NOW)**

* No stochastic / randomness

* No Monte Carlo

* No probability distributions

* No optimization

* No forecasting

* No external data ingestion

* No web scraping

* No regulatory modeling

* No scenario comparison UI

* No dashboards

---

## **4\. TARGET USER & DECISION TYPES (MUST SUPPORT)**

### **Target Users**

* Founder / CFO of a **post-PMF consumer subscription company**

* Monthly revenue, paid user base, active churn tracking

### **Decision Types to Support in V1**

1. Increase / decrease ad spend

2. Change pricing or plans

3. Launch in new geography

4. Reduce burn

5. Change onboarding / funnel

6. Introduce free trial vs paid only

---

## **5\. SYSTEM OVERVIEW (WHAT ENGINEERS ARE BUILDING)**

This step builds a **single pipeline**:

`Founder Prompt`  
   `↓`  
`Decision Parsing`  
   `↓`  
`Causal Discovery (2nd/3rd order)`  
   `↓`  
`Deterministic Financial Model Compilation`  
   `↓`  
`Validated Equation System Output`

Internally this is split into two modules:

* **Module A:** Causal Discovery

* **Module B:** Financial Model Compiler

Externally it appears as **one Financial Intelligence Agent**.

---

## **6\. INPUT CONTRACT**

`{`  
  `prompt_text: string,`  
  `time_horizon_months: optional integer,`  
  `known_metrics: optional list,`  
  `current_revenue: optional number,`  
  `current_paid_users: optional number,`  
  `geography: optional string`  
`}`

Example prompt:

“If we double Facebook ad spend for our $10/month meditation app, what happens to cash and churn over the next year?”

---

# **MODULE A — CAUSAL DISCOVERY (CONSUMER SUBSCRIPTION LOGIC)**

## **7\. OBJECTIVE**

Discover **all materially relevant variables and feedback loops** specific to **consumer subscription businesses**.

---

## **8\. REQUIRED CAPABILITIES**

### **A-1. Decision Archetype Classification**

Classify prompt into:

* Ad spend change

* Pricing experiment

* Funnel change

* Market expansion

* Burn reduction

* Product monetization change

---

### **A-2. Consumer Subscription Template Loading**

Load the **canonical B2C subscription driver tree**, including:

**Core Layers**

* Acquisition

* Activation

* Engagement

* Retention

* Monetization

* Cash & Burn

---

### **A-3. Primary Variable Extraction (Direct)**

Must extract or infer:

* ad\_spend

* CAC

* installs

* activations

* paid\_conversion\_rate

* paid\_users

* monthly\_churn

* ARPU

* MRR

* refunds

* gross\_revenue

* platform\_fees

* payment\_processing\_fees

* payroll

* infra\_cost

* marketing\_cost

* burn

* cash\_balance

---

### **A-4. Hidden Variable Discovery (Mandatory)**

The agent must always evaluate and potentially add:

* **Ad fatigue / saturation**

* **Cohort-specific churn**

* **Delayed cancellation behavior**

* **Organic vs paid quality delta**

* **Payment failure rate**

* **Price sensitivity elasticity**

* **Feature-driven engagement decay**

* **Support load / review risk**

Each hidden variable must include:

* Why it matters

* Which primary variable it impacts

---

### **A-5. Second- & Third-Order Effect Mapping**

For every **decision lever**, enumerate:

**Example: Increase Ad Spend**

* 1st Order: Paid installs ↑

* 2nd Order: Support tickets ↑ → churn ↑

* 3rd Order: App store ratings ↓ → organic installs ↓

All such effects must be captured.

---

### **A-6. Causal Graph Construction**

Build a **Directed Acyclic Graph (DAG)** with:

* Nodes \= variables

* Edges \= causal direction

* Edge metadata:

  * sign (+/–)

  * lag (immediate / delayed in months)

---

### **A-7. Materiality Ranking**

Rank all variables into:

* **Tier 1:** Required for simulation

* **Tier 2:** Optional refinement

* **Tier 3:** Out-of-scope for MVP

Ranking factors:

* Revenue sensitivity

* Cash sensitivity

* Data availability

* Modeling feasibility

---

## **9\. MODULE A OUTPUT CONTRACT**

`{`  
  `decision_type,`  
  `time_horizon,`  
  `tier_1_variables,`  
  `tier_2_variables,`  
  `tier_3_variables,`  
  `causal_graph,`  
  `second_order_effects,`  
  `excluded_variables_with_reason`  
`}`

---

# **MODULE B — FINANCIAL MODEL COMPILER (DETERMINISTIC ONLY)**

## **10\. OBJECTIVE**

Convert **Tier-1 consumer-subscription variables** into a **fully deterministic equation system**.

---

## **11\. REQUIRED CAPABILITIES**

### **B-1. Variable Typing**

Each Tier-1 variable must be tagged as:

* stock / flow

* count / rate / currency

* monthly resolution

---

### **B-2. Acquisition & Funnel Equations**

Examples:

`installs_t = ad_spend_t / CAC_t`  
`paid_users_t = paid_users_t-1 + new_paid_users_t - churned_users_t`

---

### **B-3. Churn & Cohort Logic (Deterministic)**

Support:

* Static churn

* Cohort-specific churn

* Trial-to-paid conversion churn

Symbolic only:

`churned_users_t = paid_users_t × churn_rate_t`

---

### **B-4. Revenue Equations**

`MRR_t = paid_users_t × ARPU_t`  
`gross_revenue_t = MRR_t × 12 / 12`

---

### **B-5. Cost & Burn Equations**

`burn_t = payroll_t + infra_t + marketing_t + platform_fees_t`

---

### **B-6. Cash Flow Identity**

`cash_t+1 = cash_t + gross_revenue_t − burn_t`

---

### **B-7. Unit Economics формulas (Symbolic)**

`LTV = ARPU / churn_rate`  
`payback_period = CAC / (ARPU × gross_margin)`

---

### **B-8. Deterministic State Transitions**

For **every Tier-1 variable**:

`x(t+1) = f(x(t), parent_variables)`

No stochastic term allowed.

---

### **B-9. Mathematical Integrity Validation**

System must guarantee:

* No circular equations without time lag

* No negative revenue, cost, or users

* Dimensional correctness

---

## **12\. MODULE B OUTPUT CONTRACT**

`{`  
  `state_variables,`  
  `variable_types,`  
  `deterministic_identities,`  
  `transition_functions,`  
  `unit_economics_formulas,`  
  `constraints`  
`}`

---

## **13\. TRACEABILITY & EXPLAINABILITY (MANDATORY)**

For every:

* Variable

* Edge

* Equation

Store:

* Which causal rule introduced it

* Which template generated it

* Which second-order logic triggered it

This is mandatory for enterprise trust.

---

## **14\. NON-FUNCTIONAL ENGINEERING REQUIREMENTS**

* Deterministic outputs for identical input

* Versioned models

* Modular agent architecture

* Machine-readable JSON outputs

* Human-readable explanation layer

* API-first design

---

## **15\. MVP SUCCESS CRITERIA**

This phase is considered successful when:

* 80%+ of real consumer-subscription prompts compile into valid equation systems

* Finance professionals can review equations without fundamental corrections

* Second- and third-order effects are visible and explainable

* Equation systems are stable (no NaNs, no blow-ups)

* End-to-end generation time \< 5 minutes

---

## **16\. EXPLICIT BUILD ORDER FOR ENGINEERS**

Engineers must implement in this exact order:

1. Prompt intake & decision classification

2. Consumer-subscription causal template

3. Hidden variable discovery logic

4. Second-order effect mapping

5. Causal DAG generator

6. Tier ranking system

7. Deterministic financial equation compiler

8. Integrity & constraint validator

9. JSON export layer

10. Human explanation generator

---

## **17\. WHAT “DONE” LOOKS LIKE**

Given input like:

“If we double ad spend for our $15/month meditation app, what happens to cash over 12 months?”

The system must output:

* A full causal DAG

* Ranked variable set

* Complete deterministic equation system

* No randomness

* No predictions

* No charts

* No UI assumptions

Just **pure financial system logic**.

