'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface MermaidRendererProps {
  code: string;
}

export default function MermaidRenderer({ code }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryBorderColor: '#2563eb',
        primaryTextColor: '#ffffff',
        secondaryColor: '#22c55e',
        secondaryBorderColor: '#16a34a',
        secondaryTextColor: '#ffffff',
        tertiaryColor: '#f97316',
        tertiaryBorderColor: '#ea580c',
        tertiaryTextColor: '#ffffff',
        lineColor: '#6b7280',
        textColor: '#171717',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#ffffff',
      },
    });
  }, []);

  useEffect(() => {
    const renderMermaid = async () => {
      if (!containerRef.current) return;
      
      try {
        setError(null);
        const { svg } = await mermaid.render('mermaid-chart', code);
        if (!containerRef.current) return;
        containerRef.current.innerHTML = svg;
        setIsLoaded(true);
      } catch (err) {
        setError((err as Error).message);
        console.error('Mermaid rendering error:', err);
      }
    };

    renderMermaid();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [code]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const applyNodeColors = () => {
      const nodes = svg.querySelectorAll('.node');
      
      nodes.forEach((node) => {
        const nodeElement = node as HTMLElement;
        const label = nodeElement.querySelector('.label text')?.textContent || '';
        const rect = nodeElement.querySelector('rect');
        
        if (rect) {
          const rectElement = rect as SVGElement;
          
          if (label.includes('开始') || label.includes('结束') || 
              label.includes('Start') || label.includes('End') ||
              label.includes('开始') || label.includes('结束')) {
            rectElement.setAttribute('fill', '#22c55e');
            rectElement.setAttribute('stroke', '#16a34a');
            rectElement.setAttribute('rx', '20');
            rectElement.setAttribute('ry', '20');
          } else if (label.includes('？') || label.includes('是否') || 
                     label.includes('是否') || label.includes('判断') ||
                     label.includes('if') || label.includes('else') ||
                     label.includes('条件')) {
            rectElement.setAttribute('fill', '#f97316');
            rectElement.setAttribute('stroke', '#ea580c');
            rectElement.setAttribute('rx', '0');
            rectElement.setAttribute('ry', '0');
            const width = parseFloat(rectElement.getAttribute('width') || '0');
            const height = parseFloat(rectElement.getAttribute('height') || '0');
            rectElement.setAttribute('width', String(height));
            rectElement.setAttribute('height', String(width));
          } else {
            rectElement.setAttribute('fill', '#3b82f6');
            rectElement.setAttribute('stroke', '#2563eb');
            rectElement.setAttribute('rx', '6');
            rectElement.setAttribute('ry', '6');
          }
        }
        
        const textElements = nodeElement.querySelectorAll('.label text');
        textElements.forEach((text) => {
          const textElement = text as SVGElement;
          textElement.setAttribute('fill', '#ffffff');
          textElement.setAttribute('font-weight', '500');
        });
      });

      const edges = svg.querySelectorAll('.edgePath path, .arrowheadPath path');
      edges.forEach((edge) => {
        const edgeElement = edge as SVGElement;
        edgeElement.setAttribute('stroke', '#6b7280');
        edgeElement.setAttribute('fill', '#6b7280');
      });
    };

    applyNodeColors();

    const nodes = svg.querySelectorAll('.node');
    
    nodes.forEach((node) => {
      const nodeElement = node as HTMLElement;
      
      nodeElement.addEventListener('mouseenter', () => {
        setHoveredElement(nodeElement.getAttribute('id') || null);
      });
      
      nodeElement.addEventListener('mouseleave', () => {
        setHoveredElement(null);
      });
    });
  }, [isLoaded]);

  useEffect(() => {
    if (!containerRef.current || hoveredElement === null) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const nodes = svg.querySelectorAll('.node');
    
    nodes.forEach((node) => {
      const nodeElement = node as HTMLElement;
      const nodeId = nodeElement.getAttribute('id');
      
      if (nodeId === hoveredElement) {
        nodeElement.style.opacity = '1';
        nodeElement.style.filter = 'brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
        nodeElement.style.transform = 'scale(1.05)';
        nodeElement.style.transition = 'all 0.2s ease';
        nodeElement.style.zIndex = '10';
      } else {
        nodeElement.style.opacity = '0.35';
        nodeElement.style.filter = 'brightness(0.7)';
        nodeElement.style.transform = 'scale(1)';
        nodeElement.style.transition = 'all 0.2s ease';
        nodeElement.style.zIndex = '1';
      }
    });

    const edges = svg.querySelectorAll('.edgePath, .arrowheadPath');
    edges.forEach((edge) => {
      const edgeElement = edge as HTMLElement;
      edgeElement.style.opacity = hoveredElement ? '0.2' : '1';
      edgeElement.style.transition = 'opacity 0.2s ease';
    });

    return () => {
      nodes.forEach((node) => {
        const nodeElement = node as HTMLElement;
        nodeElement.style.opacity = '1';
        nodeElement.style.filter = 'none';
        nodeElement.style.transform = 'scale(1)';
        nodeElement.style.zIndex = '1';
      });
      
      edges.forEach((edge) => {
        const edgeElement = edge as HTMLElement;
        edgeElement.style.opacity = '1';
      });
    };
  }, [hoveredElement]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setIsExpanded(false);
  }, []);

  if (error) {
    return (
      <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-medium">Mermaid渲染错误:</p>
        <p className="text-red-500 text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="my-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">
          Mermaid 流程图
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-neutral-200 text-[#6b7280] hover:text-[#171717] transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-neutral-200 text-[#6b7280] hover:text-[#171717] transition-colors"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="px-2 py-1 text-xs text-[#6b7280] hover:text-[#171717] transition-colors"
          >
            重置
          </button>
        </div>
      </div>
      
      <div className="relative rounded-lg border border-[rgba(0,0,0,0.08)] overflow-hidden bg-white">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-full p-4 flex items-center justify-center cursor-pointer"
        >
          <div
            className={`transition-all duration-300 ease-out ${isExpanded ? 'fixed inset-4 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl' : ''}`}
            style={{
              transform: `scale(${isExpanded ? 1 : scale})`,
              transformOrigin: 'center center',
            }}
          >
            <div
              ref={containerRef}
              className="min-w-full min-h-full flex items-center justify-center"
              style={{
                backgroundColor: '#ffffff',
                maxHeight: isExpanded ? '90vh' : '400px',
                overflow: 'hidden',
              }}
            />
          </div>
        </button>
        
        {isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="fixed top-4 right-4 px-3 py-1.5 text-sm bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors z-50"
          >
            关闭放大
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-xs text-[#6b7280]">开始/结束</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-500"></span>
          <span className="text-xs text-[#6b7280]">普通步骤</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-orange-500 transform rotate-45" style={{width: '12px', height: '12px'}}></span>
          <span className="text-xs text-[#6b7280]">判断条件</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-gray-500"></span>
          <span className="text-xs text-[#6b7280]">箭头连线</span>
        </div>
      </div>
    </div>
  );
}