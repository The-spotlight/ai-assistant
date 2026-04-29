'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';

export default function MouseSparkles() {
  const [init, setInit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(
    () => ({
      fpsLimit: 60,
      particles: {
        number: {
          value: 0,
        },
        color: {
          value: ['#FFD700', '#FFA500', '#FF6347', '#FFFFFF', '#FFD700', '#FFFF00'],
        },
        shape: {
          type: 'circle' as const,
        },
        opacity: {
          value: { min: 0.4, max: 1 },
          anim: {
            enable: true,
            speed: 3,
            opacityMin: 0,
            sync: false,
          },
        },
        size: {
          value: { min: 2, max: 6 },
          random: true,
        },
        move: {
          enable: true,
          speed: { min: 8, max: 15 },
          direction: 'none' as const,
          random: true,
          straight: false,
          outModes: {
            default: 'out' as const,
          },
          bounce: false,
        },
        glow: {
          enable: true,
          color: '#FFD700',
          opacity: 0.8,
          size: { min: 5, max: 15 },
        },
        life: {
          duration: {
            value: { min: 0.5, max: 1.5 },
          },
          count: 1,
          delay: {
            value: 0,
          },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'trail' as const,
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          trail: {
            delay: 0.001,
            pauseOnStop: true,
            quantity: 8,
            particles: {
              life: {
                duration: {
                  value: { min: 0.3, max: 0.8 },
                },
              },
              move: {
                speed: { min: 10, max: 25 },
              },
              size: {
                value: { min: 1, max: 4 },
              },
            },
          },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  if (!init) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ 
        background: 'transparent',
        maskImage: 'radial-gradient(circle, black 60%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 100%)',
      }}
    >
      <Particles options={options} />
    </div>
  );
}