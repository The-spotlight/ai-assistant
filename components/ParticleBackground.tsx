'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';

export default function ParticleBackground() {
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
          value: 80,
          density: {
            enable: true,
          },
        },
        color: {
          value: ['#171717', '#374151', '#6b7280', '#9ca3af'],
        },
        shape: {
          type: 'circle' as const,
        },
        opacity: {
          value: { min: 0.1, max: 0.5 },
          random: true,
          anim: {
            enable: true,
            speed: 1,
            opacityMin: 0.1,
            sync: false,
          },
        },
        size: {
          value: { min: 1, max: 4 },
          random: true,
          anim: {
            enable: true,
            speed: 2,
            sizeMin: 1,
            sync: false,
          },
        },
        links: {
          enable: true,
          distance: 150,
          color: '#9ca3af',
          opacity: 0.2,
          width: 1,
        },
        move: {
          enable: true,
          speed: { min: 0.5, max: 1.5 },
          direction: 'none' as const,
          random: true,
          straight: false,
          outModes: {
            default: 'out' as const,
          },
          bounce: false,
          attract: {
            enable: true,
            rotateX: 600,
            rotateY: 600,
          },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'grab' as const,
            parallax: {
              enable: true,
              force: 60,
              smooth: 10,
            },
          },
          onClick: {
            enable: true,
            mode: 'push' as const,
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          grab: {
            distance: 100,
            links: {
              opacity: 0.5,
            },
          },
          bubble: {
            distance: 400,
            size: 40,
            duration: 2,
            opacity: 8,
            speed: 3,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
          push: {
            quantity: 4,
          },
          remove: {
            quantity: 2,
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
    <Particles
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'linear-gradient(135deg, #f6f6f7 0%, #ffffff 100%)' }}
      options={options}
    />
  );
}