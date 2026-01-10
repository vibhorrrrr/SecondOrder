import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulate, generateNodes } from '../services/api';
import SimulationChart from './SimulationChart';

function SimulationDashboard() {
    const SIM_MONTHS = 12;
    const SIM_RUNS = 50;
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [initialState, setInitialState] = useState({
        cash: 1000000,
        burn: 50000,
        revenue: 20000,
        cac: 100,
        customers: 500,
        arpu: 40,
        ltv: 1200,
        ad_spend: 10000,
        traffic: 10000,
        new_customers: 200,
        runway: 20,
        churn_rate: 0.05,
        month: 0
    });

    const [options, setOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [simulationResults, setSimulationResults] = useState(null);
    const [loadingSimulation, setLoadingSimulation] = useState(false);
    const [error, setError] = useState(null);
    const [apiQuotaExhausted, setApiQuotaExhausted] = useState(false);

    // Validation rules: fields that must be positive (> 0) vs non-negative (>= 0)
    const mustBePositive = ['cash', 'customers', 'arpu', 'ltv']; // Cannot be 0 or negative
    const nonNegative = ['burn', 'revenue', 'cac', 'ad_spend', 'traffic', 'new_customers', 'runway', 'month']; // Cannot be negative
    const isPercentage = ['churn_rate']; // Must be between 0 and 1

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let numValue = parseFloat(value);

        // Apply validation rules
        if (isNaN(numValue)) {
            numValue = 0;
        }

        if (mustBePositive.includes(name)) {
            numValue = Math.max(1, numValue); // Minimum 1
        } else if (nonNegative.includes(name)) {
            numValue = Math.max(0, numValue); // Minimum 0
        } else if (isPercentage.includes(name)) {
            numValue = Math.max(0, Math.min(1, numValue)); // Between 0 and 1
        }

        setInitialState(prev => ({
            ...prev,
            [name]: numValue
        }));
    };

    // Helper function to check if error is API quota related
    const isQuotaError = (errorMessage) => {
        const quotaKeywords = [
            'quota', 'rate limit', 'rate_limit', 'too many requests',
            '429', 'exhausted', 'exceeded', 'limit exceeded',
            'resource exhausted', 'resourceexhausted'
        ];
        const lowerMessage = errorMessage.toLowerCase();
        return quotaKeywords.some(keyword => lowerMessage.includes(keyword));
    };

    const handleGenerateOptions = async () => {
        setLoadingOptions(true);
        setError(null);
        setApiQuotaExhausted(false);
        setOptions([]);
        try {
            const data = await generateNodes(initialState);
            if (data.nodes) {
                setOptions(data.nodes);
            }
        } catch (err) {
            if (isQuotaError(err.message)) {
                setApiQuotaExhausted(true);
            } else {
                setError(err.message);
            }
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleRunSimulation = async (option) => {
        setSelectedOption(option);
        setLoadingSimulation(true);
        setError(null);
        setApiQuotaExhausted(false);
        setSimulationResults(null);

        try {
            const actionPayload = option?.suggested_shifts && typeof option.suggested_shifts === 'object'
                ? option.suggested_shifts
                : {};

            const results = await simulate(initialState, actionPayload, SIM_MONTHS, SIM_RUNS);

            const resultNode = {
                id: 'sim_result',
                strategy: option,
                description: option?.description || option?.name || 'Selected decision',
                meta: {
                    months: SIM_MONTHS,
                    num_runs: SIM_RUNS,
                    action_applied: actionPayload,
                },
                finance: {
                    summary: `Survival Probability: ${(results.survival_probability * 100).toFixed(1)}%`,
                    metrics: [
                        { name: 'Survival Probability', value: results.survival_probability * 100, unit: '%', type: 'survival' },
                        { name: 'P50 Cash', value: results.p50, unit: '$', type: 'median' },
                        { name: 'P10 Cash', value: results.p10, unit: '$', type: 'downside' },
                        { name: 'P90 Cash', value: results.p90, unit: '$', type: 'upside' },
                    ],
                    recommendations: results.gemini_recommendations || [],
                    risks: results.gemini_risks || [],
                },
                research: {
                    confidence: results.survival_probability,
                    summary: `Distribution summary across ${SIM_RUNS} Monte Carlo runs.`,
                    risks: results.gemini_risks,
                    opportunities: results.gemini_opportunities
                },
                traces: results.traces,
                series: results.series
            };

            setSimulationResults(resultNode);

        } catch (err) {
            if (isQuotaError(err.message)) {
                setApiQuotaExhausted(true);
            } else {
                setError(err.message);
            }
        } finally {
            setLoadingSimulation(false);
        }
    };

    const getMetricColor = (type) => {
        switch (type) {
            case 'survival': return 'from-cyan-500 to-blue-500';
            case 'median': return 'from-amber-500 to-orange-500';
            case 'downside': return 'from-red-500 to-rose-500';
            case 'upside': return 'from-emerald-500 to-green-500';
            default: return 'from-purple-500 to-indigo-500';
        }
    };

    const getMetricGlow = (type) => {
        switch (type) {
            case 'survival': return 'shadow-cyan-500/20';
            case 'median': return 'shadow-amber-500/20';
            case 'downside': return 'shadow-red-500/20';
            case 'upside': return 'shadow-emerald-500/20';
            default: return 'shadow-purple-500/20';
        }
    };

    return (
        <div className="dashboard-container">
            {/* Animated Background */}
            <div className="dashboard-bg" />
            <div className="dashboard-grid-overlay" />

            {/* Mobile Header */}
            <div className="mobile-header">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="menu-button"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="mobile-title">
                    <span className="gradient-text-sm">Second Order</span> Simulator
                </span>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="sidebar-overlay"
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <button
                        onClick={() => navigate('/')}
                        className="back-to-home"
                    >
                        ← Home
                    </button>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="close-sidebar"
                    >
                        ✕
                    </button>
                </div>

                <div className="sidebar-brand">
                    <h1 className="brand-title">
                        <span className="gradient-text-sm">SecondOrder</span>
                    </h1>
                    <p className="brand-subtitle">Business Simulator</p>
                </div>

                <div className="sidebar-section">
                    <h2 className="section-label">
                        <span className="label-icon">⚙️</span>
                        Current State
                    </h2>

                    <div className="input-grid">
                        {Object.entries(initialState).map(([key, value]) => (
                            <div key={key} className="input-group">
                                <label className="input-label">
                                    {key.replace(/_/g, ' ')}
                                </label>
                                <input
                                    type="number"
                                    name={key}
                                    value={value}
                                    onChange={handleInputChange}
                                    className="input-field"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerateOptions}
                    disabled={loadingOptions}
                    className="generate-button"
                >
                    {loadingOptions ? (
                        <>
                            <span className="button-spinner" />
                            Generating...
                        </>
                    ) : (
                        <>
                            Generate Strategic Options
                        </>
                    )}
                </button>

                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}
            </aside>

            {/* API Quota Exhausted Modal */}
            {apiQuotaExhausted && (
                <div className="quota-modal-overlay">
                    <div className="quota-modal">
                        <div className="quota-modal-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                        </div>
                        <h2 className="quota-modal-title">API Limit Reached</h2>
                        <p className="quota-modal-description">
                            The Gemini AI API quota has been exhausted. This typically happens when too many requests are made in a short period.
                        </p>
                        <div className="quota-modal-tips">
                            <div className="quota-tip">
                                <span className="tip-icon">⏱️</span>
                                <span>Wait a few minutes before trying again</span>
                            </div>
                            <div className="quota-tip">
                                <span className="tip-icon">🔄</span>
                                <span>The limit resets periodically (usually per minute)</span>
                            </div>
                            <div className="quota-tip">
                                <span className="tip-icon">💡</span>
                                <span>Consider upgrading your API plan for higher limits</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setApiQuotaExhausted(false)}
                            className="quota-modal-button"
                        >
                            Got it, I'll try later
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="main-content">
                <div className="content-inner">
                    {/* Strategic Options */}
                    {options.length > 0 && !simulationResults && !loadingSimulation && (
                        <div className="options-section">
                            <div className="section-header">
                                <h2 className="section-title">
                                    <span className="title-icon">🎲</span>
                                    Strategic Decisions
                                </h2>
                                <p className="section-description">
                                    Select a decision to run Monte Carlo simulation
                                </p>
                            </div>
                            <div className="options-grid">
                                {options.map((option, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleRunSimulation(option)}
                                        className="option-card"
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <div className="option-header">
                                            <h3 className="option-title">
                                                {option.name || 'Decision'}
                                            </h3>
                                            <span className="option-probability">
                                                {(option.probability * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="option-body">
                                            <p className="option-description">
                                                {option.description}
                                            </p>
                                            {option.impact && (
                                                <p className="option-impact">
                                                    <span className="impact-label">Impact:</span> {option.impact}
                                                </p>
                                            )}
                                            {option.suggested_shifts && (
                                                <div className="option-shifts">
                                                    <span className="shifts-label">Shifts:</span>
                                                    {Object.entries(option.suggested_shifts)
                                                        .slice(0, 3)
                                                        .map(([k, v]) => (
                                                            <span key={k} className="shift-tag">
                                                                {k.replace(/_/g, ' ')} → {v}
                                                            </span>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="option-footer">
                                            <span className="run-simulation-text">
                                                Click to simulate →
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loadingSimulation && (
                        <div className="loading-container">
                            <div className="loading-spinner">
                                <div className="spinner-ring"></div>
                                <div className="spinner-ring"></div>
                                <div className="spinner-ring"></div>
                            </div>
                            <h3 className="loading-title">Running Monte Carlo Simulations</h3>
                            <p className="loading-description">
                                Simulating {SIM_RUNS} parallel futures across {SIM_MONTHS} months...
                            </p>
                            <div className="loading-steps">
                                <div className="step active">1st Order Effects</div>
                                <div className="step active">2nd Order Loops</div>
                                <div className="step active">3rd Order AI</div>
                            </div>
                        </div>
                    )}

                    {/* Results View */}
                    {simulationResults && (
                        <div className="results-section">
                            <button
                                onClick={() => setSimulationResults(null)}
                                className="back-button"
                            >
                                ← Back to Options
                            </button>

                            {/* Decision Summary */}
                            <div className="decision-summary-grid">
                                <div className="decision-card">
                                    <div className="decision-header">
                                        <div className="decision-label">Selected Decision</div>
                                        <h3 className="decision-title">
                                            {selectedOption?.name || 'Decision'}
                                        </h3>
                                        {selectedOption?.description && (
                                            <p className="decision-description">
                                                {selectedOption.description}
                                            </p>
                                        )}
                                    </div>
                                    {typeof selectedOption?.probability === 'number' && (
                                        <div className="probability-badge">
                                            <span className="probability-label">Success Probability</span>
                                            <span className="probability-value">
                                                {(selectedOption.probability * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    )}
                                    {selectedOption?.impact && (
                                        <div className="impact-card">
                                            <div className="impact-title">Projected Impact</div>
                                            <p className="impact-text">{selectedOption.impact}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="params-card">
                                    <h3 className="params-title">
                                        <span className="params-icon">📊</span>
                                        Simulation Parameters
                                    </h3>
                                    <dl className="params-list">
                                        <div className="param-item">
                                            <dt>Initial Cash</dt>
                                            <dd>${initialState.cash.toLocaleString()}</dd>
                                        </div>
                                        <div className="param-item">
                                            <dt>Monthly Burn</dt>
                                            <dd>${initialState.burn.toLocaleString()}</dd>
                                        </div>
                                        <div className="param-item">
                                            <dt>Churn Rate</dt>
                                            <dd>{(initialState.churn_rate * 100).toFixed(1)}%</dd>
                                        </div>
                                        <div className="param-item">
                                            <dt>Simulation Runs</dt>
                                            <dd>{simulationResults.meta?.num_runs || SIM_RUNS}</dd>
                                        </div>
                                        <div className="param-item">
                                            <dt>Duration</dt>
                                            <dd>{simulationResults.meta?.months || SIM_MONTHS} Months</dd>
                                        </div>
                                    </dl>

                                    {selectedOption?.suggested_shifts && Object.keys(selectedOption.suggested_shifts).length > 0 && (
                                        <div className="shifts-section">
                                            <h4 className="shifts-title">Applied Shifts</h4>
                                            <ul className="shifts-list">
                                                {Object.entries(selectedOption.suggested_shifts).map(([k, v]) => (
                                                    <li key={k} className="shift-item">
                                                        <span className="shift-key">{k.replace(/_/g, ' ')}</span>
                                                        <span className="shift-value">{String(v)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="metrics-grid">
                                {simulationResults.finance.metrics.map((metric, idx) => (
                                    <div
                                        key={idx}
                                        className={`metric-card ${getMetricGlow(metric.type)}`}
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <div className={`metric-gradient ${getMetricColor(metric.type)}`} />
                                        <div className="metric-content">
                                            <div className="metric-label">{metric.name}</div>
                                            <div className="metric-value">
                                                {metric.name.includes('Prob') ? '' : '$'}
                                                {metric.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                {metric.unit === '%' ? '%' : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chart */}
                            <SimulationChart
                                data={simulationResults.series}
                                months={simulationResults.meta?.months || SIM_MONTHS}
                                numRuns={simulationResults.meta?.num_runs || SIM_RUNS}
                            />

                            {/* AI Analysis */}
                            <div className="ai-analysis-card">
                                <h3 className="ai-title">
                                    <span className="ai-icon">🤖</span>
                                    Gemini AI Strategic Analysis
                                </h3>
                                <div className="ai-grid">
                                    <div className="ai-section">
                                        <h4 className="ai-section-title recommendations">
                                            <span>💡</span> Recommendations
                                        </h4>
                                        <ul className="ai-list">
                                            {simulationResults.finance.recommendations.length > 0 ? (
                                                simulationResults.finance.recommendations.map((rec, i) => (
                                                    <li key={i} className="ai-item">{rec}</li>
                                                ))
                                            ) : (
                                                <li className="ai-item empty">No specific recommendations generated.</li>
                                            )}
                                        </ul>
                                    </div>
                                    <div className="ai-section">
                                        <h4 className="ai-section-title risks">
                                            <span>⚠️</span> Identified Risks
                                        </h4>
                                        <ul className="ai-list">
                                            {simulationResults.finance.risks.length > 0 ? (
                                                simulationResults.finance.risks.map((r, i) => (
                                                    <li key={i} className="ai-item">{r}</li>
                                                ))
                                            ) : (
                                                <li className="ai-item empty">No specific risks flagged.</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {options.length === 0 && !loadingOptions && !simulationResults && (
                        <div className="empty-state">
                            <div className="empty-illustration">
                                <div className="empty-orb"></div>
                                <div className="empty-rings">
                                    <div className="ring"></div>
                                    <div className="ring"></div>
                                    <div className="ring"></div>
                                </div>
                            </div>
                            <h2 className="empty-title">Ready to Simulate</h2>
                            <p className="empty-description">
                                Configure your business state in the sidebar and generate strategic options to begin.
                            </p>
                            <div className="empty-features">
                                <div className="feature">
                                    <span>50+ Monte Carlo Paths</span>
                                </div>
                                <div className="feature">

                                    <span>Gemini AI Analysis</span>
                                </div>
                                <div className="feature">

                                    <span>P10/P50/P90 Distributions</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default SimulationDashboard;
