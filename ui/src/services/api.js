// In production (Vercel), use /api prefix. In development, proxy handles it.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function simulate(initialState, action, months = 12, numRuns = 20) {
    try {
        const response = await fetch(`${API_BASE}/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initial_state: initialState,
                action: action,
                months: months,
                num_runs: numRuns
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Simulation failed:", error);
        throw error;
    }
}

export async function generateNodes(state) {
    try {
        const response = await fetch(`${API_BASE}/generate_nodes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ state }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Node generation failed:", error);
        throw error;
    }
}

// Dummy function to satisfy NodeDetails import, though we mostly pass traces directly now
export async function getNodeTraces(simulationId, nodeId) {
    // In a real implementation with a persistent backend DB, this would fetch traces.
    // For now, we return empty or expect traces to be passed directly.
    return { traces: [], agent_summary: {} };
}
