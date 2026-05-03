'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useLayoutContext } from '@/components/ResizablePanel';

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconGitBranch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

function IconZoomIn(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function IconZoomOut(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function IconRefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

type ConversationNode = {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
};

type ConversationEdge = {
  source: string;
  target: string;
  type: 'branch' | 'merge' | 'reference';
};

type NodeColorCategory = 'today' | 'week' | 'older';

function getColorCategory(updatedAt: string): NodeColorCategory {
  const now = Date.now();
  const updated = new Date(updatedAt).getTime();
  const diffMs = now - updated;
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  if (diffMs < oneDay) return 'today';
  if (diffMs < oneWeek) return 'week';
  return 'older';
}

function getNodeColor(category: NodeColorCategory): string {
  switch (category) {
    case 'today':
      return '#3b82f6';
    case 'week':
      return '#22c55e';
    case 'older':
      return '#a3a3a3';
  }
}

function getNodeRadius(messageCount: number): number {
  const minRadius = 25;
  const maxRadius = 55;
  const minMessages = 1;
  const maxMessages = 100;

  const clamped = Math.min(Math.max(messageCount, minMessages), maxMessages);
  const ratio = (clamped - minMessages) / (maxMessages - minMessages);
  return minRadius + ratio * (maxRadius - minRadius);
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

interface ConversationGraphPanelProps {
  visible: boolean;
  onClose: () => void;
  conversations: {
    id: string;
    title: string | null;
    updatedAt: string;
    createdAt: string;
  }[];
  onConversationClick: (conversationId: string) => void;
  deviceId: string | null;
}

export default function ConversationGraphPanel({
  visible,
  onClose,
  conversations,
  onConversationClick,
  deviceId,
}: ConversationGraphPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<ConversationNode[]>([]);
  const edgesRef = useRef<ConversationEdge[]>([]);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    messageCount: number;
    updatedAt: string;
  } | null>(null);
  const [nodeMessageCounts, setNodeMessageCounts] = useState<Map<string, number>>(new Map());

  const { widthCategory } = useLayoutContext();
  const isNarrow = widthCategory === 'narrow';

  const generateMockData = useCallback(() => {
    if (conversations.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes: ConversationNode[] = [];
    const edges: ConversationEdge[] = [];

    const centerX = 0;
    const centerY = 0;

    conversations.forEach((conv, index) => {
      const angle = (2 * Math.PI * index) / conversations.length;
      const radius = 150 + Math.random() * 100;

      nodes.push({
        id: conv.id,
        title: conv.title?.trim() || '新对话',
        messageCount: nodeMessageCounts.get(conv.id) || Math.floor(Math.random() * 50) + 3,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      });
    });

    if (nodes.length > 1) {
      const typeWeights = [
        { type: 'branch' as const, weight: 0.5 },
        { type: 'reference' as const, weight: 0.35 },
        { type: 'merge' as const, weight: 0.15 },
      ];

      const getRandomType = (): ConversationEdge['type'] => {
        const rand = Math.random();
        let cumulative = 0;
        for (const { type, weight } of typeWeights) {
          cumulative += weight;
          if (rand < cumulative) return type;
        }
        return 'reference';
      };

      for (let i = 1; i < nodes.length; i++) {
        const parentIndex = Math.floor(Math.random() * i);
        edges.push({
          source: nodes[parentIndex].id,
          target: nodes[i].id,
          type: getRandomType(),
        });
      }

      if (nodes.length > 4) {
        const extraEdgeCount = Math.min(Math.floor(nodes.length / 3), 5);
        for (let i = 0; i < extraEdgeCount; i++) {
          const sourceIdx = Math.floor(Math.random() * nodes.length);
          let targetIdx = Math.floor(Math.random() * nodes.length);
          while (targetIdx === sourceIdx) {
            targetIdx = Math.floor(Math.random() * nodes.length);
          }
          const exists = edges.some(
            (e) =>
              (e.source === nodes[sourceIdx].id && e.target === nodes[targetIdx].id) ||
              (e.source === nodes[targetIdx].id && e.target === nodes[sourceIdx].id)
          );
          if (!exists) {
            edges.push({
              source: nodes[sourceIdx].id,
              target: nodes[targetIdx].id,
              type: 'reference',
            });
          }
        }
      }
    }

    return { nodes, edges };
  }, [conversations, nodeMessageCounts]);

  const loadMessageCounts = useCallback(async () => {
    if (!deviceId || conversations.length === 0) return;

    const counts = new Map<string, number>();
    
    for (const conv of conversations.slice(0, 10)) {
      try {
        const r = await fetch(`/api/conversations/${conv.id}/messages`, {
          headers: { 'x-device-id': deviceId },
        });
        if (r.ok) {
          const data = await r.json();
          counts.set(conv.id, data.messages?.length || 0);
        }
      } catch (e) {
        console.error('Failed to load message count:', e);
      }
    }
    
    setNodeMessageCounts(counts);
  }, [deviceId, conversations]);

  useEffect(() => {
    if (visible && deviceId) {
      loadMessageCounts();
    }
  }, [visible, deviceId, loadMessageCounts]);

  useEffect(() => {
    if (!visible) return;

    const { nodes, edges } = generateMockData();
    nodesRef.current = nodes;
    edgesRef.current = edges;

    setScale(1);
    setOffset({ x: 0, y: 0 });
    setHoveredNode(null);
    setTooltip(null);
  }, [visible, generateMockData]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    if (nodes.length === 0) {
      ctx.save();
      ctx.translate(rect.width / 2, rect.height / 2);
      ctx.fillStyle = '#a3a3a3';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无对话数据', 0, 0);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(rect.width / 2 + offset.x, rect.height / 2 + offset.y);
    ctx.scale(scale, scale);

    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;

      const sourceRadius = getNodeRadius(sourceNode.messageCount);
      const targetRadius = getNodeRadius(targetNode.messageCount);

      const nx = dx / dist;
      const ny = dy / dist;

      const startX = sourceNode.x + nx * sourceRadius;
      const startY = sourceNode.y + ny * sourceRadius;
      const endX = targetNode.x - nx * targetRadius;
      const endY = targetNode.y - ny * targetRadius;

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      const controlX = (startX + endX) / 2 + ny * 30;
      const controlY = (startY + endY) / 2 - nx * 30;
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);

      let strokeColor = '#d4d4d4';
      let lineWidth = 1.5;

      if (edge.type === 'branch') {
        strokeColor = '#f59e0b';
        lineWidth = 2;
      } else if (edge.type === 'merge') {
        strokeColor = '#8b5cf6';
        lineWidth = 2;
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(edge.type === 'reference' ? [5, 5] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      const arrowSize = 8;
      const arrowAngle = Math.atan2(endY - controlY, endX - controlX);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = strokeColor;
      ctx.fill();
    });

    nodes.forEach((node) => {
      const category = getColorCategory(node.updatedAt);
      const color = getNodeColor(category);
      const radius = getNodeRadius(node.messageCount);
      const isHovered = hoveredNode === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + (isHovered ? 4 : 2), 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? `${color}30` : `${color}15`;
      ctx.fill();

      const gradient = ctx.createRadialGradient(
        node.x - radius * 0.3,
        node.y - radius * 0.3,
        0,
        node.x,
        node.y,
        radius
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, `${color}dd`);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(node.x - radius * 0.3, node.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(11, Math.min(radius * 0.35, 16))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(node.messageCount), node.x, node.y);
    });

    ctx.restore();
  }, [scale, offset, hoveredNode]);

  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    if (nodes.length === 0) return;

    const damping = 0.9;
    const repulsionStrength = 5000;
    const attractionStrength = 0.01;
    const centerPullStrength = 0.001;

    nodes.forEach((node, i) => {
      if (node.fixed) return;

      let fx = 0;
      let fy = 0;

      nodes.forEach((other, j) => {
        if (i === j) return;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 1;
        const force = repulsionStrength / distSq;
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      });

      fx += -node.x * centerPullStrength;
      fy += -node.y * centerPullStrength;

      node.vx = (node.vx + fx) * damping;
      node.vy = (node.vy + fy) * damping;
    });

    edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (!source || !target || source.fixed || target.fixed) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = 180;
      const diff = (dist - targetDist) * attractionStrength;

      const ax = (dx / dist) * diff;
      const ay = (dy / dist) * diff;

      source.vx += ax;
      source.vy += ay;
      target.vx -= ax;
      target.vy -= ay;
    });

    nodes.forEach((node) => {
      if (node.fixed) return;
      node.x += node.vx;
      node.y += node.vy;
    });
  }, []);

  useEffect(() => {
    if (!visible) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    let frameCount = 0;
    const maxFrames = 300;

    const animate = () => {
      if (frameCount < maxFrames) {
        simulate();
        frameCount++;
      }
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [visible, simulate, draw]);

  const getNodeAtPosition = useCallback(
    (clientX: number, clientY: number): ConversationNode | null => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return null;

      const rect = container.getBoundingClientRect();
      const nodes = nodesRef.current;

      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;

      const worldX = (canvasX - rect.width / 2 - offset.x) / scale;
      const worldY = (canvasY - rect.height / 2 - offset.y) / scale;

      for (const node of nodes) {
        const radius = getNodeRadius(node.messageCount);
        const dx = worldX - node.x;
        const dy = worldY - node.y;
        if (dx * dx + dy * dy <= radius * radius) {
          return node;
        }
      }

      return null;
    },
    [scale, offset]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const node = getNodeAtPosition(e.clientX, e.clientY);
      if (node) {
        const foundNode = nodesRef.current.find((n) => n.id === node.id);
        if (foundNode) {
          foundNode.fixed = true;
        }
      } else {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      }
    },
    [getNodeAtPosition, offset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      if (isDragging) {
        setOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else {
        const node = getNodeAtPosition(e.clientX, e.clientY);
        if (node) {
          if (hoveredNode !== node.id) {
            setHoveredNode(node.id);
            setTooltip({
              x: e.clientX,
              y: e.clientY,
              title: node.title,
              messageCount: node.messageCount,
              updatedAt: node.updatedAt,
            });
            document.body.style.cursor = 'pointer';
          } else if (tooltip) {
            setTooltip({
              ...tooltip,
              x: e.clientX,
              y: e.clientY,
            });
          }

          const foundNode = nodesRef.current.find((n) => n.id === node.id);
          if (foundNode && foundNode.fixed) {
            const rect = container.getBoundingClientRect();
            const worldX = (e.clientX - rect.left - rect.width / 2 - offset.x) / scale;
            const worldY = (e.clientY - rect.top - rect.height / 2 - offset.y) / scale;
            foundNode.x = worldX;
            foundNode.y = worldY;
          }
        } else {
          if (hoveredNode) {
            setHoveredNode(null);
            setTooltip(null);
            document.body.style.cursor = '';
          }
        }
      }
    },
    [isDragging, dragStart, getNodeAtPosition, hoveredNode, tooltip, scale, offset]
  );

  const handleMouseUp = useCallback(() => {
    nodesRef.current.forEach((node) => {
      node.fixed = false;
    });
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;

      const node = getNodeAtPosition(e.clientX, e.clientY);
      if (node) {
        onClose();
        onConversationClick(node.id);
      }
    },
    [isDragging, getNodeAtPosition, onClose, onConversationClick]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.max(0.3, Math.min(3, prev + delta)));
    },
    []
  );

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.cursor = '';
    };
  }, [visible, onClose]);

  useEffect(() => {
    const handleResize = () => {
      draw();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#171717]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <IconGitBranch className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-medium text-white">对话关系图</span>
          <span className="rounded-full px-2 py-0.5 text-xs bg-white/10 text-gray-300">
            {conversations.length} 个对话
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setScale((prev) => Math.min(3, prev + 0.2))}
            className="flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="放大"
            aria-label="放大"
          >
            <IconZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setScale((prev) => Math.max(0.3, prev - 0.2))}
            className="flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="缩小"
            aria-label="缩小"
          >
            <IconZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="重置视图"
            aria-label="重置视图"
          >
            <IconRefreshCw className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="关闭 (Esc)"
            aria-label="关闭"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        {tooltip && (
          <div
            className="fixed pointer-events-none z-10"
            style={{
              left: tooltip.x + 15,
              top: tooltip.y + 15,
            }}
          >
            <div className="bg-[#262626] border border-white/10 rounded-lg shadow-xl px-3 py-2 min-w-[160px]">
              <p className="text-sm font-medium text-white mb-1 truncate max-w-[200px]">
                {tooltip.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                  {tooltip.messageCount} 条消息
                </span>
                <span>·</span>
                <span>{formatRelativeTime(tooltip.updatedAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-[#1f1f1f]">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-[#3b82f6]" />
            今天
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-[#22c55e]" />
            本周
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-[#a3a3a3]" />
            更早
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-[#f59e0b]" />
            分支
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-[#8b5cf6]" />
            合并
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 border-t border-dashed border-[#d4d4d4]" />
            引用
          </span>
        </div>

        <div className="text-xs text-gray-500">
          滚轮缩放 · 拖动平移 · 点击节点跳转
        </div>
      </div>
    </div>
  );
}
