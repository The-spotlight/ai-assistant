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

function IconInfo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
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
};

type ConversationEdge = {
  source: string;
  target: string;
  type: 'branch' | 'merge' | 'reference';
};

type NodeColorCategory = 'today' | 'week' | 'older';

type StatsApiResponse = {
  messageCounts: Record<string, number>;
  conversations: Record<string, {
    id: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  crossConversationRelations: Array<{
    sourceConversationId: string;
    targetConversationId: string;
    type: 'reference' | 'branch' | 'merge';
    sourceMessageId: string;
    targetMessageId: string;
  }>;
};

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

function calculateSpiralLayout(
  conversations: Array<{ id: string; createdAt: string }>,
  centerX: number = 0,
  centerY: number = 0
): Map<string, { x: number; y: number }> {
  const sorted = [...conversations].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const positions = new Map<string, { x: number; y: number }>();
  const baseRadius = 100;
  const radiusIncrement = 80;
  const angleIncrement = (Math.PI * 2) / 5;

  sorted.forEach((conv, index) => {
    const layer = Math.floor(index / 5);
    const positionInLayer = index % 5;
    const radius = baseRadius + layer * radiusIncrement;
    const angle = positionInLayer * angleIncrement + layer * 0.3;

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    positions.set(conv.id, { x, y });
  });

  return positions;
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasRealRelations, setHasRealRelations] = useState(false);
  const [showRelationInfo, setShowRelationInfo] = useState(false);

  const { widthCategory } = useLayoutContext();

  const loadStatsData = useCallback(async () => {
    if (!deviceId || conversations.length === 0) return;

    setIsLoading(true);
    try {
      const r = await fetch('/api/conversations/stats', {
        headers: { 'x-device-id': deviceId },
      });

      if (r.ok) {
        const data = (await r.json()) as StatsApiResponse;
        
        const positions = calculateSpiralLayout(conversations);
        const nodes: ConversationNode[] = [];
        const edges: ConversationEdge[] = [];

        conversations.forEach((conv) => {
          const pos = positions.get(conv.id) || { x: 0, y: 0 };
          nodes.push({
            id: conv.id,
            title: conv.title?.trim() || '新对话',
            messageCount: data.messageCounts[conv.id] ?? 0,
            updatedAt: conv.updatedAt,
            createdAt: conv.createdAt,
            x: pos.x,
            y: pos.y,
          });
        });

        const addedEdges = new Set<string>();
        data.crossConversationRelations.forEach((rel) => {
          const sourceExists = conversations.some((c) => c.id === rel.sourceConversationId);
          const targetExists = conversations.some((c) => c.id === rel.targetConversationId);
          
          if (sourceExists && targetExists && rel.sourceConversationId !== rel.targetConversationId) {
            const edgeKey = `${rel.sourceConversationId}-${rel.targetConversationId}`;
            if (!addedEdges.has(edgeKey)) {
              edges.push({
                source: rel.sourceConversationId,
                target: rel.targetConversationId,
                type: rel.type,
              });
              addedEdges.add(edgeKey);
            }
          }
        });

        setHasRealRelations(edges.length > 0);

        nodesRef.current = nodes;
        edgesRef.current = edges;
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
      
      const positions = calculateSpiralLayout(conversations);
      const nodes: ConversationNode[] = [];

      conversations.forEach((conv) => {
        const pos = positions.get(conv.id) || { x: 0, y: 0 };
        nodes.push({
          id: conv.id,
          title: conv.title?.trim() || '新对话',
          messageCount: 0,
          updatedAt: conv.updatedAt,
          createdAt: conv.createdAt,
          x: pos.x,
          y: pos.y,
        });
      });

      nodesRef.current = nodes;
      edgesRef.current = [];
      setHasRealRelations(false);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, conversations]);

  useEffect(() => {
    if (!visible) return;

    setScale(1);
    setOffset({ x: 0, y: 0 });
    setHoveredNode(null);
    setTooltip(null);

    if (deviceId) {
      loadStatsData();
    }
  }, [visible, deviceId, loadStatsData]);

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
      if (isLoading) {
        ctx.fillText('正在加载数据...', 0, 0);
      } else {
        ctx.fillText('暂无对话数据', 0, 0);
      }
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
  }, [scale, offset, hoveredNode, isLoading]);

  useEffect(() => {
    if (!visible) return;
    draw();
  }, [visible, draw]);

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
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    },
    [offset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
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
        } else {
          if (hoveredNode) {
            setHoveredNode(null);
            setTooltip(null);
            document.body.style.cursor = '';
          }
        }
      }
    },
    [isDragging, dragStart, getNodeAtPosition, hoveredNode, tooltip]
  );

  const handleMouseUp = useCallback(() => {
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
          {!hasRealRelations && conversations.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRelationInfo(!showRelationInfo)}
              className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
              title="关于对话关系"
            >
              <IconInfo className="h-3.5 w-3.5" />
              <span>无关联数据</span>
            </button>
          )}
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

      {showRelationInfo && (
        <div className="absolute top-14 left-4 right-4 z-10 max-w-md">
          <div className="bg-[#262626] border border-yellow-500/30 rounded-lg shadow-xl px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-400 mb-2">关于对话关系</p>
                <p className="text-xs text-gray-300 leading-relaxed mb-2">
                  当前数据模型中没有对话级别的关联关系。关系图中显示的边（引用）来自：
                </p>
                <ul className="text-xs text-gray-400 space-y-1 ml-4 list-disc">
                  <li>跨对话的消息回复（消息 replyToId 指向其他对话的消息）</li>
                </ul>
                <p className="text-xs text-gray-400 mt-2">
                  如果需要支持「分支」和「合并」类型的关联，需要在数据库中新增对话关系表。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRelationInfo(false)}
                className="text-gray-400 hover:text-white transition-colors shrink-0"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
              <p className="text-sm text-gray-400">正在加载对话数据...</p>
            </div>
          </div>
        )}

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
