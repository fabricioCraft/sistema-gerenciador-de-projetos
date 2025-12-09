'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Edge,
    Node,
    Position,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { calculateSchedule } from '@/lib/scheduler';

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: direction,
        align: 'DL',
        ranksep: 400,
        nodesep: 150
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
        node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { nodes, edges };
};

export function NetworkGraph({ tasks }: { tasks: any[] }) {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const scheduled = calculateSchedule(tasks.map(t => ({
            id: t.id,
            title: t.title,
            duration: t.duration || 1,
            dependencies: t.dependencies || [],
        })));

        const nodes: Node[] = scheduled.map(t => ({
            id: t.id,
            data: { label: t.title },
            position: { x: 0, y: 0 },
            style: t.isCritical ? { border: '2px solid red', background: '#fee2e2' } : { background: '#f5f5f5' }
        }));

        const edges: Edge[] = [];
        scheduled.forEach(t => {
            t.dependencies.forEach(depId => {
                // Find if dependency is critical
                // Edge is critical if both source and target are critical? Not necessarily, but usually part of path.
                // Simplification: Color red if target is critical?
                // Actually, critical path edge connects two critical nodes AND slack is 0.
                // For now, red if 'isCritical' is true for both? Or simple default.
                const isTargetCritical = t.isCritical;
                // Check source (depId) critical status
                const sourceTask = scheduled.find(s => s.id === depId);
                const isSourceCritical = sourceTask?.isCritical;

                // Simplistic approach: Red if both critical?
                // Better: Use slack logic, but here assume consistent if both are on path.
                const isCriticalEdge = isTargetCritical && isSourceCritical;

                edges.push({
                    id: `${depId}-${t.id}`,
                    source: depId,
                    target: t.id,
                    animated: true,
                    style: isCriticalEdge ? { stroke: 'red', strokeWidth: 2 } : { stroke: '#b1b1b7' },
                });
            });
        });

        return getLayoutedElements(nodes, edges);
    }, [tasks]);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <ReactFlow
                nodes={initialNodes}
                edges={initialEdges}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
