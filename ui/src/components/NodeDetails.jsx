import { useState, useEffect, useMemo } from 'react'
import { getNodeTraces } from '../services/api'
import TraceViewerModal from './TraceViewerModal'

function NodeDetails({ node, simulationId, providedTraces }) {
    const [activeTab, setActiveTab] = useState('research')
    const [nodeTracesData, setNodeTracesData] = useState({ traces: [], agent_summary: {} })
    const [loadingTraces, setLoadingTraces] = useState(false)
    const [showTraceModal, setShowTraceModal] = useState(false)

    // Load traces for current node
    useEffect(() => {
        if (providedTraces) {
            setNodeTracesData({ traces: providedTraces, agent_summary: {} })
        } else if (simulationId && node?.id) {
            loadNodeTraces()
        }
    }, [simulationId, node?.id, providedTraces])

    const loadNodeTraces = async () => {
        if (!simulationId || !node?.id) return
        setLoadingTraces(true)
        try {
            const data = await getNodeTraces(simulationId, node.id)
            setNodeTracesData(data)
        } catch (error) {
            console.error('Failed to load node traces:', error)
            setNodeTracesData({ traces: [], agent_summary: {} })
        } finally {
            setLoadingTraces(false)
        }
    }

    const traces = nodeTracesData.traces || []
    const agentSummary = nodeTracesData.agent_summary || {}

    // Group traces by agent for better visualization
    const tracesByAgent = useMemo(() => {
        const grouped = {}
        traces.forEach(trace => {
            const agent = trace.agent || 'system'
            if (!grouped[agent]) {
                grouped[agent] = []
            }
            grouped[agent].push(trace)
        })
        return grouped
    }, [traces])

    // Count tool calls per agent
    const toolCallsByAgent = useMemo(() => {
        const counts = {}
        traces.forEach(trace => {
            if (trace.event === 'tool_start') {
                const agent = trace.agent || 'system'
                counts[agent] = (counts[agent] || 0) + 1
            }
        })
        return counts
    }, [traces])

    const getConfidenceColor = (conf) => {
        if (conf >= 0.7) return 'bg-emerald-500'
        if (conf >= 0.4) return 'bg-amber-500'
        return 'bg-red-500'
    }

    const research = node.research
    const finance = node.finance

    return (
        <div>
            {/* Node Header */}
            <div className="mb-4">
                <div className="mb-1 font-mono text-[10px] text-zinc-600">
                    {node.id} • Depth {node.depth || 0}
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">
                    {node.description}
                </p>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-1 rounded-lg bg-zinc-900 p-1">
                <button
                    onClick={() => setActiveTab('research')}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === 'research'
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    Research
                </button>
                <button
                    onClick={() => setActiveTab('finance')}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === 'finance'
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    Finance {finance && <span className="ml-1 text-amber-400">💰</span>}
                </button>
                <button
                    onClick={() => setActiveTab('traces')}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === 'traces'
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    Traces
                </button>
            </div>

            {activeTab === 'research' && (
                <>
                    {research ? (
                        <div className="space-y-4">
                            {/* Confidence */}
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">Confidence</span>
                                    <span className="font-mono text-sm font-medium text-white">
                                        {(research.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                                    <div
                                        className={`h-full transition-all ${getConfidenceColor(research.confidence)}`}
                                        style={{ width: `${research.confidence * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Summary */}
                            <div>
                                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                                    Summary
                                </h4>
                                <p className="rounded-lg border-l-2 border-blue-500 bg-zinc-900/50 py-2 pl-3 pr-2 text-xs leading-relaxed text-zinc-400">
                                    {research.summary}
                                </p>
                            </div>

                            {/* Opportunities */}
                            {research.opportunities?.length > 0 && (
                                <div>
                                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                                        Opportunities
                                    </h4>
                                    <div className="space-y-1.5">
                                        {research.opportunities.map((opp, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-2 rounded-lg bg-emerald-500/5 px-3 py-2 text-xs text-zinc-400"
                                            >
                                                <span className="mt-0.5 text-emerald-500">↑</span>
                                                {opp}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Risks */}
                            {research.risks?.length > 0 && (
                                <div>
                                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                                        Risks
                                    </h4>
                                    <div className="space-y-1.5">
                                        {research.risks.map((risk, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-2 rounded-lg bg-red-500/5 px-3 py-2 text-xs text-zinc-400"
                                            >
                                                <span className="mt-0.5 text-red-500">↓</span>
                                                {risk}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendation */}
                            {research.recommendation && (
                                <div>
                                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                                        Recommendation
                                    </h4>
                                    <div className="rounded-lg border border-zinc-800 bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-3 text-xs leading-relaxed text-zinc-300">
                                        {research.recommendation}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-xs text-zinc-600">
                            No research data available
                        </div>
                    )}
                </>
            )}

            {activeTab === 'finance' && (
                <>
                    {finance ? (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div>
                                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                                    Financial Summary
                                </h4>
                                <p className="rounded-lg border-l-2 border-amber-500 bg-zinc-900/50 py-2 pl-3 pr-2 text-xs leading-relaxed text-zinc-400">
                                    {finance.summary}
                                </p>
                            </div>

                            {/* Metrics */}
                            {finance.metrics?.length > 0 && (
                                <div>
                                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                                        Key Metrics
                                    </h4>
                                    <div className="space-y-2">
                                        {finance.metrics.map((metric, i) => (
                                            <div
                                                key={i}
                                                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                                            >
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="text-xs font-medium text-zinc-300">{metric.name}</span>
                                                    <span className="font-mono text-sm font-semibold text-amber-400">
                                                        {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value} {metric.unit}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500">{metric.interpretation}</p>
                                                {metric.benchmark && (
                                                    <div className="mt-1 text-[10px] text-blue-400">
                                                        📊 Benchmark: {metric.benchmark}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Insights */}
                            {finance.insights?.length > 0 && (
                                <div>
                                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                                        Financial Insights
                                    </h4>
                                    <div className="space-y-1.5">
                                        {finance.insights.map((insight, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-zinc-400"
                                            >
                                                <span className="mt-0.5 text-amber-500">💡</span>
                                                {insight}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {finance.recommendations?.length > 0 && (
                                <div>
                                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                                        Recommendations
                                    </h4>
                                    <div className="space-y-1.5">
                                        {finance.recommendations.map((rec, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-2 rounded-lg bg-blue-500/5 px-3 py-2 text-xs text-zinc-400"
                                            >
                                                <span className="mt-0.5 text-blue-500">→</span>
                                                {rec}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Financial Risks */}
                            {finance.risks?.length > 0 && (
                                <div>
                                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                                        Financial Risks
                                    </h4>
                                    <div className="space-y-1.5">
                                        {finance.risks.map((risk, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-2 rounded-lg bg-red-500/5 px-3 py-2 text-xs text-zinc-400"
                                            >
                                                <span className="mt-0.5 text-red-500">⚠️</span>
                                                {risk}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Data Quality Notes */}
                            {finance.data_quality_notes && (
                                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-[11px] text-zinc-500">
                                    <span className="font-medium text-zinc-400">ℹ️ Data Note:</span> {finance.data_quality_notes}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-xs text-zinc-600">
                            No financial analysis available
                        </div>
                    )}
                </>
            )}

            {activeTab === 'traces' && (
                <div className="space-y-4">
                    {/* Agent Activity Summary */}
                    {!loadingTraces && traces.length > 0 && (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Agent Activity Summary
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(agentSummary).map(([agent, count]) => {
                                    const agentColor = agent === 'ResearchAgent'
                                        ? 'border-emerald-500/30 bg-emerald-500/10'
                                        : agent === 'NodeGenerator'
                                            ? 'border-blue-500/30 bg-blue-500/10'
                                            : agent === 'FinanceAnalyst'
                                                ? 'border-amber-500/30 bg-amber-500/10'
                                                : 'border-purple-500/30 bg-purple-500/10'
                                    const textColor = agent === 'ResearchAgent'
                                        ? 'text-emerald-400'
                                        : agent === 'NodeGenerator'
                                            ? 'text-blue-400'
                                            : agent === 'FinanceAnalyst'
                                                ? 'text-amber-400'
                                                : 'text-purple-400'
                                    const toolCalls = toolCallsByAgent[agent] || 0

                                    return (
                                        <div key={agent} className={`rounded-lg border p-2 ${agentColor}`}>
                                            <div className={`text-[10px] font-medium ${textColor}`}>{agent}</div>
                                            <div className="mt-1 flex items-baseline gap-1">
                                                <span className="text-lg font-bold text-white">{count}</span>
                                                <span className="text-[10px] text-zinc-500">events</span>
                                            </div>
                                            {toolCalls > 0 && (
                                                <div className="mt-1 text-[10px] text-zinc-500">
                                                    🔧 {toolCalls} tool call{toolCalls !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* View Full Trace Button */}
                    {traces.length > 0 && (
                        <button
                            onClick={() => setShowTraceModal(true)}
                            className="w-full flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-500/50"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Full Trace Timeline
                            <span className="text-[10px] text-cyan-500/70">({traces.length} events)</span>
                        </button>
                    )}

                    {/* Agent Steps Timeline */}
                    {loadingTraces ? (
                        <div className="py-8 text-center text-xs text-zinc-600">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-zinc-600 border-t-cyan-400 mr-2"></div>
                            Loading traces...
                        </div>
                    ) : traces.length > 0 ? (
                        <div className="space-y-3">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Execution Timeline
                            </h4>
                            {/* Group by agent for clearer visualization */}
                            {Object.entries(tracesByAgent).map(([agent, agentTraces]) => {
                                const agentColor = agent === 'ResearchAgent'
                                    ? 'border-emerald-500/30'
                                    : agent === 'NodeGenerator'
                                        ? 'border-blue-500/30'
                                        : agent === 'FinanceAnalyst'
                                            ? 'border-amber-500/30'
                                            : 'border-purple-500/30'
                                const headerBg = agent === 'ResearchAgent'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : agent === 'NodeGenerator'
                                        ? 'bg-blue-500/10 text-blue-400'
                                        : agent === 'FinanceAnalyst'
                                            ? 'bg-amber-500/10 text-amber-400'
                                            : 'bg-purple-500/10 text-purple-400'

                                return (
                                    <div key={agent} className={`rounded-lg border ${agentColor} overflow-hidden`}>
                                        {/* Agent Header */}
                                        <div className={`px-3 py-2 ${headerBg} flex items-center justify-between`}>
                                            <span className="text-[11px] font-medium">{agent}</span>
                                            <span className="text-[10px] opacity-70">{agentTraces.length} steps</span>
                                        </div>
                                        {/* Agent Steps */}
                                        <div className="divide-y divide-zinc-800/50">
                                            {agentTraces.map((trace, i) => (
                                                <div key={i} className="px-3 py-2 bg-zinc-900/30">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${trace.event.includes('complete') ? 'bg-emerald-500' :
                                                                trace.event === 'tool_start' ? 'bg-amber-500' :
                                                                    trace.event === 'tool_result' ? 'bg-lime-500' :
                                                                        'bg-cyan-500'
                                                            }`}></span>
                                                        <span className="font-mono text-[10px] text-zinc-400">
                                                            {trace.event}
                                                        </span>
                                                        <span className="font-mono text-[9px] text-zinc-600 ml-auto">
                                                            {new Date(trace.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    {/* Tool details */}
                                                    {trace.event === 'tool_start' && trace.data?.name && (
                                                        <div className="mt-1 ml-3.5 text-[10px]">
                                                            <span className="text-amber-400">🔧 {trace.data.name}</span>
                                                            {trace.data.args?.query && (
                                                                <div className="mt-0.5 text-zinc-500 italic truncate">
                                                                    "{trace.data.args.query}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Completion details */}
                                                    {trace.event.includes('complete') && trace.data && (
                                                        <div className="mt-1 ml-3.5 text-[10px] text-zinc-500">
                                                            {trace.data.confidence !== undefined && (
                                                                <span className="text-emerald-400">
                                                                    ✓ Confidence: {(trace.data.confidence * 100).toFixed(0)}%
                                                                </span>
                                                            )}
                                                            {trace.data.count !== undefined && (
                                                                <span className="text-blue-400">
                                                                    ✓ Generated {trace.data.count} options
                                                                </span>
                                                            )}
                                                            {trace.data.metrics_count !== undefined && (
                                                                <span className="text-amber-400">
                                                                    ✓ {trace.data.metrics_count} metrics analyzed
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <div className="mb-3 rounded-full bg-zinc-800 p-3 inline-block">
                                <svg className="h-5 w-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-xs text-zinc-600">No agent traces recorded for this node</p>
                        </div>
                    )}
                </div>
            )}

            {/* Trace Viewer Modal */}
            <TraceViewerModal
                isOpen={showTraceModal}
                onClose={() => setShowTraceModal(false)}
                traces={traces}
                nodeDescription={node.description}
            />
        </div>
    )
}

export default NodeDetails
