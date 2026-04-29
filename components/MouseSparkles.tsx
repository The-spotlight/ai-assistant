'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';

export default function MouseSparkles() {
  const [init, setInit] = useState(false);

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
          value: ['#171717', '#3d3d3d', '#666666', '#999999', '#cccccc'],
        },
        shape: {
          type: 'circle' as const,
        },
        opacity: {
          value: { min: 0.3, max: 0.9 },
          anim: {
            enable: true,
            speed: 3,
            opacityMin: 0,
            sync: false,
          },
        },
        size: {
          value: { min: 1, max: 4 },
          random: true,
        },
        move: {
          enable: true,
          speed: { min: 6, max: 12 },
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
          color: '#3d3d3d',
          opacity: 0.5,
          size: { min: 3, max: 10 },
        },
        life: {
          duration: {
            value: { min: 0.4, max: 1.2 },
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
            quantity: 6,
            particles: {
              life: {
                duration: {
                  value: { min: 0.2, max: 0.6 },
                },
              },
              move: {
                speed: { min: 8, max: 20 },
              },
              size: {
                value: { min: 1, max: 3 },
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
    <div className="absolute inset-0 pointer-events-none">
      <Particles options={options} />
    </div>
  );
}