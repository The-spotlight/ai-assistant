'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface MermaidRendererProps {
  code: string;
}

function sanitizeSpecialChars(text: string): string {
  let sanitized = text;
  
  sanitized = sanitized.replace(/≤/g, '&le;');
  sanitized = sanitized.replace(/≥/g, '&ge;');
  sanitized = sanitized.replace(/<(?![a-zA-Z])/g, '&lt;');
  sanitized = sanitized.replace(/>/g, '&gt;');
  sanitized = sanitized.replace(/&(?!amp;)/g, '&amp;');
  
  const escapedQuotes: { [key: string]: string } = {
    '"': '\\"',
    "'": "\\'",
    '`': '\\`',
  };
  
  Object.entries(escapedQuotes).forEach(([char, escaped]) => {
    sanitized = sanitized.split(char).join(escaped);
  });
  
  return sanitized;
}

function generateSafeId(text: string): string {
  let safeId = text
    .replace(/[\s\u4e00-\u9fa5]/g, '_')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  if (!safeId) {
    safeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (!/^[a-zA-Z_]/.test(safeId)) {
    safeId = `n_${safeId}`;
  }
  
  return safeId;
}

function preprocessMermaidCode(code: string): string {
  let processed = code.trim();
  
  processed = processed.replace(/&lt;/g, '<');
  processed = processed.replace(/&gt;/g, '>');
  processed = processed.replace(/&amp;/g, '&');
  processed = processed.replace(/&quot;/g, '"');
  processed = processed.replace(/&#39;/g, "'");
  
  processed = processed.replace(/\\n/g, '\n');
  processed = processed.replace(/\\t/g, '\t');
  processed = processed.replace(/\\r/g, '\r');
  
  processed = processed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  const lines = processed.split('\n');
  const nodeIdMap = new Map<string, string>();
  
  const processedLines = lines.map((line) => {
    if (!line.trim()) return line;
    
    const graphOrFlowchartMatch = line.match(/^(graph|flowchart)\s+(\w+)?\s*$/);
    if (graphOrFlowchartMatch) {
      return line;
    }
    
    const subgraphMatch = line.match(/^(subgraph)\s+(.+)/);
    if (subgraphMatch) {
      const subgraphName = subgraphMatch[2].trim();
      const safeId = generateSafeId(subgraphName);
      if (!nodeIdMap.has(safeId)) {
        nodeIdMap.set(safeId, subgraphName);
      }
      return `subgraph ${safeId}["${sanitizeSpecialChars(subgraphName)}"]`;
    }
    
    if (line.trim() === 'end') {
      return line;
    }
    
    const nodePattern = /([^\[\]\(\)\{\}\|\-\>]+?)(\[.+?\])?(\s*-->\s*)([^\[\]\(\)\{\}\|]+?)(\[.+?\])?/g;
    let result = line;
    let match;
    
    while ((match = nodePattern.exec(line)) !== null) {
      const [fullMatch, fromPart, fromLabel, arrow, toPart, toLabel] = match;
      
      const processNode = (part: string, label: string | undefined) => {
        const trimmedPart = part.trim();
        
        if (!trimmedPart) return part;
        
        if (trimmedPart.includes('[') || trimmedPart.includes(']')) {
          return trimmedPart;
        }
        
        const isSpecial = trimmedPart === 'yes' || trimmedPart === 'no' || 
                         trimmedPart === 'true' || trimmedPart === 'false' ||
                         trimmedPart.match(/^\d+$/) !== null;
        if (isSpecial) {
          return trimmedPart;
        }
        
        const hasSpecialChars = !/^[a-zA-Z0-9_\-]+$/.test(trimmedPart);
        
        if (!hasSpecialChars && !label) {
          return trimmedPart;
        }
        
        const safeId = generateSafeId(trimmedPart);
        const displayText = label ? label.slice(1, -1) : trimmedPart;
        
        return `${safeId}["${sanitizeSpecialChars(displayText)}"]`;
      };
      
      const newFrom = processNode(fromPart, fromLabel);
      const newTo = processNode(toPart, toLabel);
      
      result = result.replace(fullMatch, `${newFrom}${arrow}${newTo}`);
    }
    
    const standaloneNodePattern = /^([^\[\]\(\)\{\}\|\-\>]+?)(\[.+?\])?$/;
    const standaloneMatch = line.match(standaloneNodePattern);
    if (standaloneMatch && !line.includes('-->')) {
      const [, nodePart, label] = standaloneMatch;
      const trimmedPart = nodePart.trim();
      
      if (trimmedPart && !trimmedPart.includes('[') && !trimmedPart.includes(']')) {
        const hasSpecialChars = !/^[a-zA-Z0-9_\-]+$/.test(trimmedPart);
        
        if (hasSpecialChars || label) {
          const safeId = generateSafeId(trimmedPart);
          const displayText = label ? label.slice(1, -1) : trimmedPart;
          result = `${safeId}["${sanitizeSpecialChars(displayText)}"]`;
        }
      }
    }
    
    result = result.replace(/\[\s*\]/g, '[ ]');
    result = result.replace(/\(\s*\)/g, '()');
    result = result.replace(/\{\s*\}/g, '{}');
    result = result.replace(/\|\s*\|/g, '| |');
    
    return result;
  });
  
  return processedLines.join('\n').trim();
}

function validateMermaidSyntax(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!code.includes('graph') && !code.includes('flowchart')) {
    errors.push('缺少graph或flowchart声明');
  }
  
  const arrowPattern = /-->/g;
  const arrows = code.match(arrowPattern);
  
  if (!arrows || arrows.length === 0) {
    errors.push('缺少箭头连接 -->');
  }
  
  const quotesPattern = /"/g;
  const quotes = code.match(quotesPattern);
  if (quotes && quotes.length % 2 !== 0) {
    errors.push('引号未正确配对');
  }
  
  return { valid: errors.length === 0, errors };
}

export default function MermaidRenderer({ code }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [renderAttempts, setRenderAttempts] = useState(0);

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
      securityLevel: 'loose',
      maxTextSize: 50000,
    });
  }, []);

  useEffect(() => {
    const validation = validateMermaidSyntax(code);
    setIsValid(validation.valid);
    setValidationErrors(validation.errors);
  }, [code]);

  const cleanupOrphanMermaidNodes = useCallback(() => {
    const orphanNodes = document.querySelectorAll('.mermaid-measure');
    orphanNodes.forEach(node => node.remove());
  }, []);

  const renderMermaid = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      setError(null);
      setIsLoaded(false);
      
      const processedCode = preprocessMermaidCode(code);
      console.log('Processed Mermaid code:', processedCode);
      
      const parseResult = await mermaid.parse(processedCode);
      if (!parseResult) {
        throw new Error('Mermaid syntax validation failed');
      }
      
      const { svg } = await mermaid.render('mermaid-chart', processedCode);
      
      if (!containerRef.current) return;
      
      containerRef.current.innerHTML = svg;
      setIsLoaded(true);
      setIsValid(true);
    } catch (err) {
      cleanupOrphanMermaidNodes();
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      setIsValid(false);
      console.error('Mermaid rendering error:', err);
    }
  }, [code, cleanupOrphanMermaidNodes]);

  useEffect(() => {
    renderMermaid();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [renderMermaid]);

  const handleRetry = useCallback(() => {
    setRenderAttempts((prev) => prev + 1);
    renderMermaid();
  }, [renderMermaid]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const applyNodeColors = () => {
      const nodes = svg.querySelectorAll('.node');
      
      nodes.forEach((node) => {
        const nodeElement = node as HTMLElement;
        const labelElement = nodeElement.querySelector('.label text') || 
                           nodeElement.querySelector('text');
        const label = labelElement?.textContent || '';
        const rect = nodeElement.querySelector('rect');
        
        if (rect) {
          const rectElement = rect as SVGElement;
          
          if (label.includes('开始') || label.includes('结束') || 
              label.includes('Start') || label.includes('End')) {
            rectElement.setAttribute('fill', '#22c55e');
            rectElement.setAttribute('stroke', '#16a34a');
            rectElement.setAttribute('rx', '20');
            rectElement.setAttribute('ry', '20');
          } else if (label.includes('？') || label.includes('是否') || 
                     label.includes('判断') || label.includes('if') || 
                     label.includes('else') || label.includes('条件')) {
            rectElement.setAttribute('fill', '#f97316');
            rectElement.setAttribute('stroke', '#ea580c');
            rectElement.setAttribute('rx', '0');
            rectElement.setAttribute('ry', '0');
          } else {
            rectElement.setAttribute('fill', '#3b82f6');
            rectElement.setAttribute('stroke', '#2563eb');
            rectElement.setAttribute('rx', '6');
            rectElement.setAttribute('ry', '6');
          }
        }
        
        const textElements = nodeElement.querySelectorAll('.label text, text');
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
        if (edgeElement.hasAttribute('fill')) {
          edgeElement.setAttribute('fill', '#6b7280');
        }
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
      <div className="my-4 rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-700">该流程图格式有误，无法渲染</span>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">原始代码</span>
          </div>
          <pre className="text-xs text-[#4d4d4d] bg-[#fafafa] p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
            {code}
          </pre>
        </div>
      </div>
    );
  }

  if (isValid === false && !error && validationErrors.length > 0) {
    return (
      <div className="my-4 rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-700">该流程图格式有误，无法渲染</span>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-yellow-600 bg-white border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">原始代码</span>
          </div>
          <pre className="text-xs text-[#4d4d4d] bg-[#fafafa] p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
            {code}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">
            Mermaid 流程图
          </span>
          {isValid === true && !error && (
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          )}
        </div>
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
          className="w-full h-full p-4 flex items-center justify-center cursor-pointer min-h-[200px]"
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