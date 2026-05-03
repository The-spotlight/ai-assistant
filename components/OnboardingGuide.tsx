'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isOnboardingCompleted, markOnboardingCompleted } from '@/lib/onboarding';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  targetSelector: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  padding?: number;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: '开始对话',
    description: '在这里输入问题开始对话，AI 会帮助你解答各种问题。',
    targetSelector: '[data-onboarding="input-area"]',
    placement: 'top',
    padding: 8,
  },
  {
    id: 2,
    title: '对话列表',
    description: '这里是你的对话列表，可以切换不同的对话，随时回到之前的讨论。',
    targetSelector: '[data-onboarding="sidebar"]',
    placement: 'right',
    padding: 8,
  },
  {
    id: 3,
    title: '个人设置',
    description: '点击这里打开设置，你可以自定义外观、模型、快捷键等体验。',
    targetSelector: '[data-onboarding="user-avatar"]',
    placement: 'bottom',
    padding: 8,
  },
  {
    id: 4,
    title: '探索技能',
    description: '试试这些技能，让 AI 帮你完成更多任务，比如搜索、计算、翻译等。',
    targetSelector: '[data-onboarding="skill-button"]',
    placement: 'top',
    padding: 8,
  },
];

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getClipPathForHighlight(rect: HighlightRect, padding: number = 4): string {
  const x = rect.left - padding;
  const y = rect.top - padding;
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;
  const r = 16;

  const points = [
    'polygon(',
    `0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,`,
    `${x}px ${y}px, ${x}px ${y + h}px,`,
    `${x + w}px ${y + h}px, ${x + w}px ${y}px,`,
    `${x}px ${y}px,`,
    `${x + r}px ${y}px,`,
    `c ${r * 0.55}px 0, ${r}px ${r * 0.45}px, ${r}px ${r}px,`,
    `l 0 ${h - r * 2}px,`,
    `c 0 ${r * 0.55}px, ${r * -0.45}px ${r}px, ${r * -1}px ${r}px,`,
    `l ${w - r * 2}px 0,`,
    `c ${r * 0.55}px 0, ${r}px ${r * -0.45}px, ${r}px ${r * -1}px,`,
    `l 0 ${r * 2 - h}px,`,
    `c 0 ${r * -0.55}px, ${r * -0.45}px ${r * -1}px, ${r * -1}px ${r * -1}px,`,
    `l ${r * 2 - w}px 0,`,
    ')',
  ].join(' ');

  return `polygon(
    0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
    ${x}px ${y}px, ${x}px ${y + h}px,
    ${x + w}px ${y + h}px, ${x + w}px ${y}px,
    ${x}px ${y}px
  )`;
}

export default function OnboardingGuide() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [targetVisible, setTargetVisible] = useState(false);
  const animationRef = useRef<number>(0);
  const lastStepRef = useRef<number>(-1);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getTargetElement = useCallback((): HTMLElement | null => {
    if (currentStep >= ONBOARDING_STEPS.length) return null;
    const step = ONBOARDING_STEPS[currentStep];
    return document.querySelector(step.targetSelector) as HTMLElement | null;
  }, [currentStep]);

  const checkTargetVisibility = useCallback(() => {
    const target = getTargetElement();
    if (!target) {
      setTargetVisible(false);
      return false;
    }

    const rect = target.getBoundingClientRect();
    const hasSize = rect.width > 0 && rect.height > 0;
    const isInViewport =
      rect.right > 0 &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.top < window.innerHeight;

    const isVisible = hasSize && isInViewport;
    setTargetVisible(isVisible);
    return isVisible;
  }, [getTargetElement]);

  const updatePositions = useCallback(() => {
    const target = getTargetElement();
    if (!target) {
      setHighlightRect({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }

    const rect = target.getBoundingClientRect();
    const step = ONBOARDING_STEPS[currentStep];
    const padding = step.padding ?? 8;

    const newHighlightRect: HighlightRect = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    setHighlightRect(newHighlightRect);

    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const gap = 16;
    const margin = 24;

    let top = 0;
    let left = 0;

    switch (step.placement) {
      case 'top':
        top = newHighlightRect.top - padding - tooltipHeight - gap;
        left =
          newHighlightRect.left + newHighlightRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = newHighlightRect.top + newHighlightRect.height + padding + gap;
        left =
          newHighlightRect.left + newHighlightRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top =
          newHighlightRect.top + newHighlightRect.height / 2 - tooltipHeight / 2;
        left = newHighlightRect.left - padding - tooltipWidth - gap;
        break;
      case 'right':
        top =
          newHighlightRect.top + newHighlightRect.height / 2 - tooltipHeight / 2;
        left = newHighlightRect.left + newHighlightRect.width + padding + gap;
        break;
    }

    if (left < margin) left = margin;
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin;
    }
    if (top < margin) {
      top = newHighlightRect.top + newHighlightRect.height + padding + gap;
    }
    if (top + tooltipHeight > window.innerHeight - margin) {
      top = window.innerHeight - tooltipHeight - margin;
      if (top < margin) top = margin;
    }

    setTooltipPosition({ top, left });
  }, [currentStep, getTargetElement]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAndStart = () => {
      try {
        const completed = isOnboardingCompleted();
        if (!completed) {
          setIsActive(true);
        }
      } catch (e) {
        console.error('[Onboarding] 检查引导状态失败:', e);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(checkAndStart, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const updateLoop = () => {
      checkTargetVisibility();
      updatePositions();
      animationRef.current = requestAnimationFrame(updateLoop);
    };

    animationRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, currentStep, checkTargetVisibility, updatePositions]);

  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => {
      updatePositions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, updatePositions]);

  useEffect(() => {
    if (!isActive) return;
    if (currentStep === lastStepRef.current) return;

    lastStepRef.current = currentStep;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const target = getTargetElement();
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      scrollTimeoutRef.current = setTimeout(() => {
        checkTargetVisibility();
        updatePositions();
      }, 500);
    }
  }, [currentStep, isActive, getTargetElement, checkTargetVisibility, updatePositions]);

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      markOnboardingCompleted();
      setIsActive(false);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    markOnboardingCompleted();
    setIsActive(false);
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleNext, handleBack, handleSkip]);

  if (!isActive || isLoading) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const padding = step.padding ?? 8;

  const highlightWithPadding = {
    top: highlightRect.top - padding,
    left: highlightRect.left - padding,
    width: highlightRect.width + padding * 2,
    height: highlightRect.height + padding * 2,
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          clipPath: targetVisible
            ? getClipPathForHighlight(highlightWithPadding, 0)
            : 'none',
          transition: 'clip-path 0.3s ease',
        }}
      />

      {targetVisible && (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              top: highlightWithPadding.top,
              left: highlightWithPadding.left,
              width: highlightWithPadding.width,
              height: highlightWithPadding.height,
              borderRadius: '16px',
              border: '2px solid #fff',
              boxShadow:
                '0 0 0 4px rgba(255, 255, 255, 0.2), 0 0 40px rgba(255, 255, 255, 0.3)',
              animation: 'pulse-onboarding 2s ease-in-out infinite',
            }}
          />

          <div
            className="absolute pointer-events-none"
            style={{
              top: highlightWithPadding.top - 4,
              left: highlightWithPadding.left - 4,
              width: highlightWithPadding.width + 8,
              height: highlightWithPadding.height + 8,
              borderRadius: '20px',
            }}
          />
        </>
      )}

      <div
        className="absolute pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: 320,
          transition: 'top 0.3s ease, left 0.3s ease',
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-black/[0.08]">
          <div className="bg-gradient-to-r from-[#171717] to-[#404040] px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/80 text-xs font-medium">
                第 {currentStep + 1} 步 / 共 {ONBOARDING_STEPS.length} 步
              </span>
              <button
                onClick={handleSkip}
                className="text-white/60 hover:text-white text-xs transition-colors"
              >
                跳过引导
              </button>
            </div>
            <div className="flex gap-2">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    index <= currentStep
                      ? 'bg-white'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-5 py-5">
            <h3 className="text-lg font-semibold text-[#171717] mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              {step.description}
            </p>

            {!targetVisible && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[#f59e0b] bg-[#fef3c7] px-3 py-2 rounded-lg">
                <span className="animate-pulse">●</span>
                <span>正在定位目标区域...</span>
              </div>
            )}
          </div>

          <div className="px-5 py-4 bg-[#fafafa] border-t border-black/[0.04] flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isFirstStep}
              className={`text-sm font-medium transition-colors ${
                isFirstStep
                  ? 'text-[#d4d4d4] cursor-not-allowed'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              上一步
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#171717] text-white text-sm font-medium rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastStep ? (
                  <>
                    <span>开始使用</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>下一步</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-onboarding {
          0%,
          100% {
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2),
              0 0 40px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.3),
              0 0 60px rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>
    </div>
  );
}
