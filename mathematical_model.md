# Mathematical Model of the Business Simulator

## 1. Introduction
This document provides the rigorous mathematical definitions governing the state transitions in the Business Simulator.

Let $S_t$ be the state vector at month $t$.
`S_t = [Cash_t, Burn_t, Revenue_t, CAC_t, LTV_t, AdSpend_t, N_t]`
Where $N_t$ is total customers.

The simulation evolves as:
`S_{t+1} = f(S_t, A, ε)`
Where $A$ is the strategic action vector and $\epsilon$ is the stochastic noise.

## 2. First Order Dynamics (Direct Accounting)
Defined in `first_order.py`.

### 2.1 Customer Acquisition
New customers ($n_{new}$) are a linear function of Ad Spend ($u_{ads}$) and CAC ($c_{acq}$):

$$ n_{new, t} = \lfloor \frac{u_{ads, t}}{c_{acq, t}} \rfloor $$

The floor function $\lfloor \cdot \rfloor$ ensures integer customers.

### 2.2 Revenue Generation
Revenue ($R_t$) is derived from the installed base:

$$ R_t = (N_t + n_{new, t}) \cdot \text{ARPU}_t $$

### 2.3 Cash Flow Equation
The fundamental accounting identity:

$$ \text{Cash}_{t+1} = \text{Cash}_t + R_t - \text{Burn}_t - u_{ads, t} $$

## 3. Second Order Dynamics (Systemic Feedback)
Defined in `second_order.py`. Non-linear feedback loops.

### 3.1 Economies of Scale (CAC Efficiency)
As Ad Spend increases, we model an efficiency gain (bargaining power / algorithm optimization) rather than immediate saturation.

$$ c_{acq, t+1} = \begin{cases} c_{acq, t} \cdot 0.95 & \text{if } u_{ads, t} > 50,000 \\ c_{acq, t} \cdot 0.98 & \text{if } u_{ads, t} > 10,000 \\ c_{acq, t} & \text{otherwise} \end{cases} $$

### 3.2 Operational Complexity (Burn Overhead)
Burn rate grows linearly with customer count (server costs, support):

$$ \text{Burn}_{t+1} = \text{Burn}_t + (N_t \cdot \$10) $$

### 3.3 Quality Dilution (LTV Decay)
If acquisition is too expensive ($CAC > 200$), we assume lower quality users:

$$ \text{LTV}_{t+1} = \text{LTV}_t \times 0.95 \quad \text{if } c_{acq} > 200 $$

## 4. Third Order Dynamics (Stochastic & Strategic)
Defined in `monte_carlo.py` and `gemini_client.py`.

### 4.1 Emergent Modifiers ($\lambda$)
The Generative AI (Gemini) or Heuristic Engine provides a vector of multipliers $\lambda$:
*   $\lambda_{burn}$: Burn Multiplier (e.g., 1.05)
*   $\lambda_{risk}$: Shock Probability (e.g., 0.1)

$$ \text{Burn}_{final} = \text{Burn}_{t} \cdot \lambda_{burn} $$

### 4.2 Monte Carlo Stochasticity
To model uncertainty, we run $M$ independent simulations. In each month $m$ of run $i$:

$$ \text{Traffic}_{i,m} = \text{Traffic}_{base} \cdot (1 + \mathcal{N}(0, \sigma)) $$

We calculate the probability of survival $P(S)$ as:

$$ P(S) = \frac{1}{M} \sum_{i=1}^M \mathbb{I}(\text{min}(\text{Cash}_{i}) > 0) $$

Where $\mathbb{I}$ is the indicator function.
