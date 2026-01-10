import { useState, useEffect, useRef } from 'react'

/**
 * StreamingPanel - Real-time display of agent activity
 * 
 * Shows:
 * - Token-by-token LLM responses with cursor animation
 * - Tool calls (web searches, etc.) with collapsible results
 * - High-level progress events
 */
function StreamingPanel({ events, isRunning }) {
    const [autoScroll, setAutoScroll] = useState(true)
    const [expandedTools, setExpandedTools] = useState({})
    const containerRef = useRef(null)
    const streamRef = useRef(null)

    // Current streaming state
    const [currentTokens, setCurrentTokens] = useState('')
    const [currentAgent, setCurrentAgent] = useState(null)
    const [toolCalls, setToolCalls] = useState([])
    const [progressEvents, setProgressEvents] = useState([])

    // Process incoming events
    useEffect(() => {
        if (!events || events.length === 0) return

        const lastEvent = events[events.length - 1]

        switch (lastEvent.event) {
            case 'token':
                if (lastEvent.data?.text) {
                    setCurrentTokens(prev => prev + lastEvent.data.text)
                    setCurrentAgent(lastEvent.data.agent)
                }
                break

            case 'tool_start':
                setToolCalls(prev => [...prev, {
                    id: Date.now(),
                    name: lastEvent.data?.name || 'tool',
                    args: lastEvent.data?.args,
                    agent: lastEvent.data?.agent,
                    status: 'running',
                    result: null,
                    timestamp: lastEvent.timestamp,
                }])
                break

            case 'tool_result':
                setToolCalls(prev => {
                    const updated = [...prev]
                    // Find the last running tool with matching name
                    for (let i = updated.length - 1; i >= 0; i--) {
                        if (updated[i].status === 'running' && updated[i].name === lastEvent.data?.name) {
                            updated[i] = {
                                ...updated[i],
                                status: 'complete',
                                result: lastEvent.data?.result,
                            }
                            break
                        }
                    }
                    return updated
                })
                break

            case 'thinking':
                // Could show a thinking indicator
                break

            case 'research_start':
            case 'generate_start':
            case 'finance_start':
            case 'expand_node':
                // New task starting - reset token stream
                if (currentTokens) {
                    setProgressEvents(prev => [...prev, {
                        type: 'stream_complete',
                        agent: currentAgent,
                        content: currentTokens,
                        timestamp: new Date().toISOString(),
                    }])
                }
                setCurrentTokens('')
                setProgressEvents(prev => [...prev, {
                    type: lastEvent.event,
                    message: lastEvent.message,
                    data: lastEvent.data,
                    timestamp: lastEvent.timestamp,
                }])
                break

            case 'research_complete':
            case 'generate_complete':
            case 'finance_complete':
                setProgressEvents(prev => [...prev, {
                    type: lastEvent.event,
                    message: lastEvent.message,
                    data: lastEvent.data,
                    timestamp: lastEvent.timestamp,
                }])
                // Reset tokens for next task
                setCurrentTokens('')
                break

            case 'completed':
            case 'failed':
                if (currentTokens) {
                    setProgressEvents(prev => [...prev, {
                        type: 'stream_complete',
                        agent: currentAgent,
                        content: currentTokens,
                        timestamp: new Date().toISOString(),
                    }])
                }
                setCurrentTokens('')
                setProgressEvents(prev => [...prev, {
                    type: lastEvent.event,
                    message: lastEvent.message,
                    data: lastEvent.data,
                    timestamp: lastEvent.timestamp,
                }])
                break

            default:
                // Other progress events
                if (lastEvent.event !== 'keepalive') {
                    setProgressEvents(prev => [...prev, {
                        type: lastEvent.event,
                        message: lastEvent.message,
                        data: lastEvent.data,
                        timestamp: lastEvent.timestamp,
                    }])
                }
        }
    }, [events])

    // Auto-scroll to bottom
    useEffect(() => {
        if (autoScroll && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [currentTokens, toolCalls, progressEvents, autoScroll])

    // Handle manual scroll
    const handleScroll = () => {
        if (!containerRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
        setAutoScroll(isAtBottom)
    }

    const toggleToolExpanded = (toolId) => {
        setExpandedTools(prev => ({
            ...prev,
            [toolId]: !prev[toolId]
        }))
    }

    const getAgentColor = (agent) => {
        if (agent === 'ResearchAgent') return 'text-emerald-400'
        if (agent === 'NodeGenerator') return 'text-blue-400'
        if (agent === 'FinanceAnalyst') return 'text-amber-400'
        return 'text-purple-400'
    }

    const getEventIcon = (type) => {
        switch (type) {
            case 'research_start': return '🔍'
            case 'research_complete': return '✓'
            case 'generate_start': return '🌿'
            case 'generate_complete': return '✓'
            case 'finance_start': return '💰'
            case 'finance_complete': return '✓'
            case 'expand_node': return '📂'
            case 'simulation_start': return '🚀'
            case 'completed': return '🎉'
            case 'failed': return '❌'
            default: return '•'
        }
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
                <div className="flex items-center gap-2">
                    {isRunning && (
                        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                    )}
                    <span className="text-xs font-medium text-zinc-400">
                        {isRunning ? 'Agent Activity' : 'Activity Log'}
                    </span>
                </div>
                <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`rounded px-2 py-1 text-[10px] transition-colors ${autoScroll
                            ? 'bg-zinc-800 text-zinc-300'
                            : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                >
                    {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
                </button>
            </div>

            {/* Content */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-auto p-3 font-mono text-xs"
            >
                {/* Progress Events */}
                {progressEvents.map((evt, i) => (
                    <div key={i} className="mb-2">
                        <div className="flex items-start gap-2 text-zinc-500">
                            <span>{getEventIcon(evt.type)}</span>
                            <span className="flex-1">{evt.message}</span>
                            <span className="text-[10px] text-zinc-700">
                                {evt.timestamp && new Date(evt.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        {evt.type === 'stream_complete' && evt.content && (
                            <div className="ml-5 mt-1 rounded border-l-2 border-zinc-700 pl-2 text-zinc-400">
                                {evt.content.slice(0, 200)}
                                {evt.content.length > 200 && '...'}
                            </div>
                        )}
                    </div>
                ))}

                {/* Tool Calls */}
                {toolCalls.map((tool) => (
                    <div
                        key={tool.id}
                        className="mb-2 rounded-lg border border-zinc-800 bg-zinc-900/50"
                    >
                        <button
                            onClick={() => toggleToolExpanded(tool.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left"
                        >
                            <span className={tool.status === 'running' ? 'animate-spin' : ''}>
                                {tool.status === 'running' ? '⏳' : '🔧'}
                            </span>
                            <span className="flex-1 text-amber-400">{tool.name}</span>
                            <span className={`text-[10px] ${getAgentColor(tool.agent)}`}>
                                {tool.agent}
                            </span>
                            <span className="text-zinc-600">
                                {expandedTools[tool.id] ? '▼' : '▶'}
                            </span>
                        </button>

                        {expandedTools[tool.id] && (
                            <div className="border-t border-zinc-800 px-3 py-2">
                                {tool.args ? (
                                    <div className="mb-2">
                                        <div className="text-[10px] text-zinc-600">Arguments:</div>
                                        <pre className="mt-1 overflow-x-auto rounded bg-zinc-950 p-2 text-[10px] text-zinc-500">
                                            {typeof tool.args === 'string'
                                                ? tool.args
                                                : JSON.stringify(tool.args, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="mb-2 text-[10px] text-zinc-600 italic">
                                        No arguments captured
                                    </div>
                                )}
                                {tool.result ? (
                                    <div>
                                        <div className="text-[10px] text-zinc-600">Result:</div>
                                        <pre className="mt-1 max-h-40 overflow-auto rounded bg-zinc-950 p-2 text-[10px] text-zinc-500">
                                            {tool.result}
                                        </pre>
                                    </div>
                                ) : tool.status === 'running' ? (
                                    <div className="text-[10px] text-zinc-600 italic flex items-center gap-2">
                                        <span className="animate-pulse">●</span> Waiting for result...
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-zinc-600 italic">
                                        No result captured
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Current Token Stream */}
                {currentTokens && (
                    <div className="mb-2">
                        <div className="mb-1 flex items-center gap-2">
                            <span className={`text-[10px] ${getAgentColor(currentAgent)}`}>
                                {currentAgent || 'Agent'}
                            </span>
                            <div className="h-px flex-1 bg-zinc-800" />
                        </div>
                        <div
                            ref={streamRef}
                            className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 leading-relaxed text-zinc-300"
                        >
                            {currentTokens}
                            <span className="inline-block h-4 w-1.5 animate-pulse bg-blue-500 align-middle" />
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isRunning && progressEvents.length === 0 && !currentTokens && (
                    <div className="flex h-full items-center justify-center text-zinc-600">
                        <div className="text-center">
                            <div className="mb-2 text-2xl">🤖</div>
                            <div>Agent activity will appear here</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StreamingPanel
