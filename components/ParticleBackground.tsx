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
          value: 180,
          density: {
            enable: true,
            valueArea: 500,
          },
        },
        color: {
          value: ['#000000', '#1a1a1a', '#2d2d2d', '#3d3d3d'],
        },
        shape: {
          type: 'circle' as const,
        },
        opacity: {
          value: { min: 0.2, max: 0.7 },
          random: true,
          anim: {
            enable: true,
            speed: 1.5,
            opacityMin: 0.15,
            sync: false,
          },
        },
        size: {
          value: { min: 1.5, max: 5 },
          random: true,
          anim: {
            enable: true,
            speed: 2.5,
            sizeMin: 1,
            sync: false,
          },
        },
        links: {
          enable: true,
          distance: 180,
          color: '#2d2d2d',
          opacity: 0.35,
          width: 1.5,
        },
        move: {
          enable: true,
          speed: { min: 0.8, max: 2 },
          direction: 'none' as const,
          random: true,
          straight: false,
          outModes: {
            default: 'out' as const,
          },
          bounce: false,
          attract: {
            enable: true,
            rotateX: 1000,
            rotateY: 1000,
          },
        },
        glow: {
          enable: true,
          color: '#000000',
          opacity: 0.4,
          size: { min: 8, max: 20 },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'grab' as const,
            parallax: {
              enable: true,
              force: 80,
              smooth: 8,
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
            distance: 220,
            links: {
              opacity: 0.7,
              color: '#000000',
            },
            particles: {
              color: '#000000',
              opacity: 1,
              size: { value: 6 },
            },
          },
          bubble: {
            distance: 400,
            size: 50,
            duration: 1.5,
            opacity: 0.9,
            speed: 4,
          },
          repulse: {
            distance: 250,
            duration: 0.3,
          },
          push: {
            quantity: 6,
          },
          remove: {
            quantity: 3,
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
      style={{ background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 50%, #f5f5f5 100%)' }}
      options={options}
    />
  );
}