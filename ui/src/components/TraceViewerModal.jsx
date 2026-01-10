import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'

/**
 * TraceViewerModal - Full trace viewer for agent execution
 * 
 * Shows complete timeline of agent events including:
 * - Tool calls with full arguments
 * - Tool results with full output
 * - Agent transitions and completion events
 */
function TraceViewerModal({ isOpen, onClose, traces, nodeDescription }) {
    const [expandedItems, setExpandedItems] = useState({})
    const modalRef = useRef(null)

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    // Close on click outside
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose()
    }

    const toggleExpanded = (id) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const expandAll = () => {
        const allExpanded = {}
        traces.forEach((_, i) => {
            allExpanded[i] = true
        })
        setExpandedItems(allExpanded)
    }

    const collapseAll = () => {
        setExpandedItems({})
    }

    const getAgentColor = (agent) => {
        switch (agent) {
            case 'ResearchAgent':
                return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            case 'FinanceAnalyst':
                return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            case 'NodeGenerator':
                return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            default:
                return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
        }
    }

    const getEventColor = (event) => {
        if (event.includes('start')) return 'text-cyan-400'
        if (event.includes('complete')) return 'text-emerald-400'
        if (event === 'tool_start' || event === 'tool_call_item') return 'text-amber-400'
        if (event === 'tool_result' || event === 'tool_output_item') return 'text-lime-400'
        if (event === 'message' || event === 'message_item') return 'text-blue-400'
        if (event === 'thinking' || event === 'reasoning_item') return 'text-purple-400'
        return 'text-zinc-400'
    }

    const getEventIcon = (event) => {
        if (event === 'tool_start' || event === 'tool_call_item') return '🔧'
        if (event === 'tool_result' || event === 'tool_output_item') return '✓'
        if (event === 'message' || event === 'message_item') return '💬'
        if (event === 'thinking' || event === 'reasoning_item') return '🤔'
        if (event.includes('start')) return '▶'
        if (event.includes('complete')) return '✔'
        return '•'
    }

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        })
    }

    const formatJson = (data) => {
        if (!data) return null
        try {
            if (typeof data === 'string') {
                // Try to parse if it's a JSON string
                try {
                    const parsed = JSON.parse(data)
                    return JSON.stringify(parsed, null, 2)
                } catch {
                    return data
                }
            }
            return JSON.stringify(data, null, 2)
        } catch {
            return String(data)
        }
    }

    const renderToolArgs = (args) => {
        if (!args) return <span className="text-zinc-600 italic">No arguments</span>

        let parsed = args
        if (typeof args === 'string') {
            try {
                parsed = JSON.parse(args)
            } catch {
                return (
                    <pre className="whitespace-pre-wrap break-words text-[11px] text-zinc-400 font-mono">
                        {args}
                    </pre>
                )
            }
        }

        // Special handling for search queries
        if (parsed.query) {
            return (
                <div className="space-y-2">
                    <div className="flex items-start gap-2">
                        <span className="text-[10px] text-zinc-500 shrink-0 mt-0.5">Query:</span>
                        <span className="text-[11px] text-amber-300 font-medium">
                            "{parsed.query}"
                        </span>
                    </div>
                    {parsed.type && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">Type:</span>
                            <span className="text-[11px] text-zinc-400">{parsed.type}</span>
                        </div>
                    )}
                </div>
            )
        }

        return (
            <pre className="whitespace-pre-wrap break-words text-[11px] text-zinc-400 font-mono bg-zinc-950/50 rounded p-2 overflow-x-auto">
                {formatJson(parsed)}
            </pre>
        )
    }

    const renderToolResult = (result) => {
        if (!result) return <span className="text-zinc-600 italic">No result</span>

        // Check if it looks like markdown
        const hasMarkdown = typeof result === 'string' &&
            (result.includes('**') || result.includes('##') || result.includes('- ') || result.includes('* '))

        if (hasMarkdown) {
            return (
                <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                        className="text-[11px] leading-relaxed text-zinc-400"
                        components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="text-zinc-200">{children}</strong>,
                            em: ({ children }) => <em className="text-zinc-400">{children}</em>,
                            code: ({ children }) => (
                                <code className="bg-zinc-900 px-1 py-0.5 rounded text-[10px] text-amber-400">{children}</code>
                            ),
                            ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                            li: ({ children }) => <li className="text-zinc-400">{children}</li>,
                            a: ({ href, children }) => (
                                <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                                    {children}
                                </a>
                            ),
                            h1: ({ children }) => <h1 className="text-sm font-semibold text-zinc-200 mt-3 mb-1">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xs font-semibold text-zinc-300 mt-2 mb-1">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs font-medium text-zinc-300 mt-2 mb-1">{children}</h3>,
                        }}
                    >
                        {result}
                    </ReactMarkdown>
                </div>
            )
        }

        // Try to parse as JSON
        try {
            const parsed = typeof result === 'string' ? JSON.parse(result) : result
            if (typeof parsed === 'object' && parsed !== null) {
                return (
                    <pre className="whitespace-pre-wrap break-words text-[11px] text-zinc-400 font-mono bg-zinc-950/50 rounded p-2 overflow-x-auto max-h-96">
                        {formatJson(parsed)}
                    </pre>
                )
            }
        } catch {
            // Not JSON, render as plain text
        }

        return (
            <pre className="whitespace-pre-wrap break-words text-[11px] text-zinc-400 font-mono bg-zinc-950/50 rounded p-2 overflow-x-auto max-h-96">
                {String(result)}
            </pre>
        )
    }

    const renderEventData = (trace, isExpanded) => {
        const { event, data } = trace

        const expandableEvents = [
            'tool_start', 'tool_result', 'tool_call_item', 'tool_output_item',
            'message', 'message_item', 'thinking', 'reasoning_item'
        ]

        if (!data && !expandableEvents.includes(event) && !event.includes('complete')) {
            return null
        }

        // Tool start events
        if (event === 'tool_start' || event === 'tool_call_item') {
            return (
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-zinc-500">TOOL</span>
                        <span className="text-xs font-mono text-amber-400">{data?.name || 'unknown'}</span>
                    </div>
                    {isExpanded && (
                        <div className="pl-3 border-l border-zinc-800">
                            <div className="text-[10px] font-medium text-zinc-500 mb-1">ARGUMENTS</div>
                            {renderToolArgs(data?.args)}
                        </div>
                    )}
                </div>
            )
        }

        // Tool result events
        if (event === 'tool_result' || event === 'tool_output_item') {
            return (
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-zinc-500">TOOL</span>
                        <span className="text-xs font-mono text-lime-400">{data?.name || 'unknown'}</span>
                        <span className="text-[10px] text-emerald-500">completed</span>
                    </div>
                    {isExpanded && (
                        <div className="pl-3 border-l border-zinc-800">
                            <div className="text-[10px] font-medium text-zinc-500 mb-1">RESULT</div>
                            {renderToolResult(data?.result || data?.output)}
                        </div>
                    )}
                </div>
            )
        }

        // Message events (agent output)
        if (event === 'message' || event === 'message_item') {
            const content = data?.content
            if (!content && !isExpanded) return null

            return (
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-zinc-500">MESSAGE</span>
                        <span className="text-[10px] text-blue-400">Agent response</span>
                    </div>
                    {isExpanded && content && (
                        <div className="pl-3 border-l border-blue-800/50">
                            <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown
                                    className="text-[11px] leading-relaxed text-zinc-300"
                                    components={{
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        strong: ({ children }) => <strong className="text-zinc-200">{children}</strong>,
                                        em: ({ children }) => <em className="text-zinc-400">{children}</em>,
                                        code: ({ children }) => (
                                            <code className="bg-zinc-900 px-1 py-0.5 rounded text-[10px] text-blue-400">{children}</code>
                                        ),
                                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                                        li: ({ children }) => <li className="text-zinc-400">{children}</li>,
                                        a: ({ href, children }) => (
                                            <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                                                {children}
                                            </a>
                                        ),
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        // Thinking/reasoning events
        if (event === 'thinking' || event === 'reasoning_item') {
            const content = data?.content
            if (!content && !isExpanded) return null

            return (
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-zinc-500">REASONING</span>
                        <span className="text-[10px] text-purple-400">Agent thinking</span>
                    </div>
                    {isExpanded && content && (
                        <div className="pl-3 border-l border-purple-800/50">
                            <div className="text-[11px] leading-relaxed text-zinc-400 italic whitespace-pre-wrap">
                                {content}
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        // For completion events, show the structured data
        if (event.includes('complete') && data && isExpanded) {
            return (
                <div className="mt-2 pl-3 border-l border-zinc-800">
                    {data.confidence !== undefined && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-zinc-500">Confidence:</span>
                            <span className="text-xs font-mono text-emerald-400">
                                {(data.confidence * 100).toFixed(0)}%
                            </span>
                        </div>
                    )}
                    {data.count !== undefined && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-zinc-500">Generated:</span>
                            <span className="text-xs font-mono text-blue-400">
                                {data.count} options
                            </span>
                        </div>
                    )}
                    {data.metrics_count !== undefined && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-zinc-500">Metrics:</span>
                            <span className="text-xs font-mono text-amber-400">
                                {data.metrics_count} analyzed
                            </span>
                        </div>
                    )}
                    {data.summary && (
                        <div className="mt-2">
                            <div className="text-[10px] font-medium text-zinc-500 mb-1">SUMMARY</div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{data.summary}</p>
                        </div>
                    )}
                    {data.nodes && data.nodes.length > 0 && (
                        <div className="mt-2">
                            <div className="text-[10px] font-medium text-zinc-500 mb-1">GENERATED NODES</div>
                            <ul className="space-y-1">
                                {data.nodes.map((node, i) => (
                                    <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">→</span>
                                        {node}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {data.reasoning && (
                        <div className="mt-2">
                            <div className="text-[10px] font-medium text-zinc-500 mb-1">REASONING</div>
                            <p className="text-[11px] text-zinc-500 italic leading-relaxed">{data.reasoning}</p>
                        </div>
                    )}
                </div>
            )
        }

        return null
    }

    if (!isOpen) return null

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-start justify-between gap-4 border-b border-zinc-800 p-4">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-zinc-200 mb-1">Agent Trace</h2>
                        {nodeDescription && (
                            <p className="text-xs text-zinc-500 truncate">{nodeDescription}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={expandAll}
                            className="px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                        >
                            Expand All
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                        >
                            Collapse All
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {traces.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-3 rounded-full bg-zinc-800 p-3">
                                <svg className="h-5 w-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-xs text-zinc-600">No trace events recorded</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {traces.map((trace, index) => {
                                const isExpanded = expandedItems[index]
                                const expandableEvents = [
                                    'tool_start', 'tool_result', 'tool_call_item', 'tool_output_item',
                                    'message', 'message_item', 'thinking', 'reasoning_item'
                                ]
                                const hasExpandableContent =
                                    expandableEvents.includes(trace.event) ||
                                    (trace.event.includes('complete') && trace.data)

                                return (
                                    <div
                                        key={index}
                                        className={`rounded-lg border transition-colors ${isExpanded
                                                ? 'border-zinc-700 bg-zinc-800/50'
                                                : 'border-zinc-800/50 bg-zinc-900/50 hover:border-zinc-700'
                                            }`}
                                    >
                                        <button
                                            onClick={() => hasExpandableContent && toggleExpanded(index)}
                                            className={`w-full px-3 py-2.5 text-left ${hasExpandableContent ? 'cursor-pointer' : 'cursor-default'}`}
                                            disabled={!hasExpandableContent}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Timeline indicator */}
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-sm ${getEventColor(trace.event)}`}>
                                                        {getEventIcon(trace.event)}
                                                    </span>
                                                    {index < traces.length - 1 && (
                                                        <div className="w-px h-2 bg-zinc-800 mt-1" />
                                                    )}
                                                </div>

                                                {/* Event info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`font-mono text-[11px] font-medium ${getEventColor(trace.event)}`}>
                                                            {trace.event}
                                                        </span>
                                                        {trace.agent && (
                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${getAgentColor(trace.agent)}`}>
                                                                {trace.agent}
                                                            </span>
                                                        )}
                                                        {trace.data?.name && ['tool_start', 'tool_result', 'tool_call_item', 'tool_output_item'].includes(trace.event) && (
                                                            <span className="text-[10px] text-zinc-500">
                                                                → {trace.data.name}
                                                            </span>
                                                        )}
                                                        {trace.data?.content && ['message', 'message_item'].includes(trace.event) && (
                                                            <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                                                                → {trace.data.content.substring(0, 50)}...
                                                            </span>
                                                        )}
                                                    </div>
                                                    {trace.message && (
                                                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                                                            {trace.message}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Timestamp and expand */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="font-mono text-[10px] text-zinc-600">
                                                        {formatTimestamp(trace.timestamp)}
                                                    </span>
                                                    {hasExpandableContent && (
                                                        <span className={`text-zinc-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                                            ▶
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>

                                        {/* Expanded content */}
                                        {isExpanded && hasExpandableContent && (
                                            <div className="px-3 pb-3 pt-0 ml-8">
                                                {renderEventData(trace, true)}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600">
                        {traces.length} event{traces.length !== 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}

export default TraceViewerModal
