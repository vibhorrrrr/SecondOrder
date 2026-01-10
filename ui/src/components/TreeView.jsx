import { useState, useCallback } from 'react'

function TreeNode({ node, nodes, selectedNodeId, onSelectNode, expandedNodes, onToggleExpand, depth = 0 }) {
    const hasChildren = node.children_ids && node.children_ids.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNodeId === node.id
    const isRoot = depth === 0

    const confidence = node.research?.confidence

    const getConfidenceColor = (conf) => {
        if (conf >= 0.7) return 'text-emerald-400'
        if (conf >= 0.4) return 'text-amber-400'
        return 'text-red-400'
    }

    const truncate = (text, maxLen = 120) => {
        if (!text) return ''
        if (text.length <= maxLen) return text
        return text.substring(0, maxLen) + '...'
    }

    return (
        <div className={`${depth > 0 ? 'ml-6 border-l border-zinc-800 pl-4' : ''}`}>
            <div className="group flex items-start gap-2 py-1.5">
                {/* Expand/Collapse */}
                <button
                    onClick={() => hasChildren && onToggleExpand(node.id)}
                    className={`mt-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded transition-colors ${hasChildren
                            ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
                            : 'text-zinc-800'
                        }`}
                >
                    {hasChildren ? (
                        <svg className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                    )}
                </button>

                {/* Node Card */}
                <div
                    onClick={() => onSelectNode(node)}
                    className={`flex-1 cursor-pointer rounded-lg border p-3 transition-all ${isSelected
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : isRoot
                                ? 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                >
                    <div className="mb-1 flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                            {isRoot ? 'Root' : `Level ${depth}`}
                        </span>
                        {confidence !== undefined && (
                            <span className={`font-mono text-[11px] font-medium ${getConfidenceColor(confidence)}`}>
                                {(confidence * 100).toFixed(0)}%
                            </span>
                        )}
                    </div>
                    <p className="text-[13px] leading-relaxed text-zinc-300">
                        {truncate(node.description)}
                    </p>
                    {(node.research || node.finance) && (
                        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-zinc-600">
                            {node.research && (
                                <>
                                    <span className="flex items-center gap-1">
                                        <span className="text-emerald-500">↑</span>
                                        {node.research.opportunities?.length || 0} opportunities
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="text-red-500">↓</span>
                                        {node.research.risks?.length || 0} risks
                                    </span>
                                </>
                            )}
                            {node.finance && (
                                <span className="flex items-center gap-1">
                                    <span className="text-amber-500">💰</span>
                                    {node.finance.metrics?.length || 0} metrics
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="mt-1">
                    {node.children_ids.map((childId) => {
                        const childNode = nodes[childId]
                        if (!childNode) return null
                        return (
                            <TreeNode
                                key={childId}
                                node={childNode}
                                nodes={nodes}
                                selectedNodeId={selectedNodeId}
                                onSelectNode={onSelectNode}
                                expandedNodes={expandedNodes}
                                onToggleExpand={onToggleExpand}
                                depth={depth + 1}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function TreeView({ tree, selectedNodeId, onSelectNode }) {
    const [expandedNodes, setExpandedNodes] = useState(() => {
        const initial = new Set()
        if (tree?.root_id) {
            initial.add(tree.root_id)
        }
        return initial
    })

    const handleToggleExpand = useCallback((nodeId) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev)
            if (next.has(nodeId)) {
                next.delete(nodeId)
            } else {
                next.add(nodeId)
            }
            return next
        })
    }, [])

    const handleExpandAll = useCallback(() => {
        setExpandedNodes(new Set(Object.keys(tree.nodes)))
    }, [tree])

    const handleCollapseAll = useCallback(() => {
        const rootOnly = new Set()
        if (tree?.root_id) rootOnly.add(tree.root_id)
        setExpandedNodes(rootOnly)
    }, [tree])

    if (!tree || !tree.root_id || !tree.nodes) return null

    const rootNode = tree.nodes[tree.root_id]
    if (!rootNode) return null

    const totalNodes = Object.keys(tree.nodes).length
    const maxDepth = Math.max(...Object.values(tree.nodes).map(n => n.depth))
    const avgConfidence = Object.values(tree.nodes)
        .filter(n => n.research?.confidence)
        .reduce((sum, n, _, arr) => sum + n.research.confidence / arr.length, 0)

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">Decision Tree</h2>
                    <div className="mt-1 flex gap-4 text-xs text-zinc-500">
                        <span>{totalNodes} nodes</span>
                        <span>Depth {maxDepth}</span>
                        <span>{(avgConfidence * 100).toFixed(0)}% avg confidence</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExpandAll}
                        className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={handleCollapseAll}
                        className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
                    >
                        Collapse
                    </button>
                </div>
            </div>

            {/* Tree */}
            <TreeNode
                node={rootNode}
                nodes={tree.nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={onSelectNode}
                expandedNodes={expandedNodes}
                onToggleExpand={handleToggleExpand}
            />
        </div>
    )
}

export default TreeView
