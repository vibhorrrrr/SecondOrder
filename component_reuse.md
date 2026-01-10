# Component & Logic Reuse: From F1 Sim to Business Sim

## 1. Overview
The **Business Simulator** was not built from scratch; it is a **derivative fork** of the core F1 Intelligence Suite simulation engine. We reused approximately **60%** of the architectural patterns and **40%** of the direct UI code to accelerate development.

## 2. UI Component Inheritance
We directly migrated and adapted three core React components from the F1 Strategy interface:

### A. `NodeDetails.jsx` (The Visualization Card)
*   **Original Purpose (F1 Sim)**: Visualized a "Race Strategy Node".
    *   *Properties:* Tire Compound, Pit Lap, Estimated Undercut.
*   **Adapted Purpose (Biz Sim)**: Visualizes a "Business Strategy Node".
    *   *Properties:* Cost, Probability, Revenue Impact.
*   **The Adaptation**: We kept the styling (`zinc-900` cards, glowing borders) and the "Property/Value" layout engine but hot-swapped the data mapping logic to render financial metrics instead of telemetry.

### B. `StreamingPanel.jsx` (The AI Console)
*   **Original Purpose**: Displayed real-time "Race Engineer Radio" transcripts from the AI.
*   **Adapted Purpose**: Displays "CFO Strategic Logic" stream.
*   **The Adaptation**: Reused the *streaming text effect* and the *auto-scroll logic*. The underlying WebSocket/Stream connection pattern remains identical, ensuring the user feels the AI is "thinking" in real-time.

### C. `TreeView.jsx` (The Decision Tree)
*   **Original Purpose**: Showed branching race scenarios (Sector 1 -> Sector 2 -> outcome).
*   **Adapted Purpose**: Shows business decision branches (Month 1 -> Month 2 -> outcome).
*   **The Adaptation**: The recursive tree rendering logic was preserved perfectly. We only changed the node color coding (from "Purple/Green" sectors to "Red/Green" cash flow health).

## 3. Backend Logic Adaptation

### A. The Gemini Client (`gemini_client.py`)
*   **Reusable Pattern**: The robust error handling, retry logic for 429s, and JSON parsing wrapper were lifted directly from the F1 Suite's Oracle.
*   **Change**: We injected the new **Heuristic Failsafe** logic *into* this existing client to make it more fail-proof than the original.

### B. Monte Carlo Engine Structure
*   **Original Logic**: Calculated `RaceTime = BasePace + TireDegradation + RandomVar`.
*   **Adapted Logic**: Calculated `CashFlow = Revenue - Burn + RandomVar`.
*   **Reuse**: The **stochastic ensemble loop** (running 50 parallel iterations to find P10/P90) is the exact mathematical skeleton of the F1 Prediction Engine. We simply replaced the physics of *Tires* with the physics of *Capital*.

## 4. Summary
By reusing the F1 Suite's "Simulation Shell" (FastAPI + React Visualization Components), we focused purely on implementing the **Business Physics** (BusinessState) rather than reinventing the wheel on how to display a graph or call an API.
