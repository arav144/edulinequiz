'use client';

import React, { useEffect, useRef } from 'react';

const HINDI_LETTERS = [
  'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ', 'क', 'ख', 'ग', 'घ',
  'च', 'छ', 'ज', 'झ', 'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न',
  'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'ज्ञ',
  'ॐ', 'ऋ', 'त्र'
];

const COLORS = [
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

interface Particle {
  x: number;
  y: number;
  char: string;
  color: string;
  size: number;
  opacity: number;
  baseSpeedY: number;
  vx: number;
  vy: number;
  wobbleSpeed: number;
  wobbleAmount: number;
  wobbleOffset: number;
  rotation: number;
  rotationSpeed: number;
}

export const FloatingHindiLetters: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates (default off-screen)
    const mouse = { x: -9999, y: -9999, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize particles: denser on larger screens, moderate on mobile
    const particleCount = Math.min(45, Math.max(22, Math.floor(width / 35)));
    const particles: Particle[] = [];

    const createParticle = (initialY?: number): Particle => {
      const size = Math.random() * 18 + 18; // 18px to 36px
      return {
        x: Math.random() * width,
        y: initialY !== undefined ? initialY : Math.random() * height,
        char: HINDI_LETTERS[Math.floor(Math.random() * HINDI_LETTERS.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size,
        opacity: Math.random() * 0.45 + 0.35, // 0.35 to 0.8
        baseSpeedY: -(Math.random() * 0.7 + 0.5), // Slow upward speed: -0.5 to -1.2
        vx: 0,
        vy: 0,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
        wobbleAmount: Math.random() * 1.2 + 0.4,
        wobbleOffset: Math.random() * Math.PI * 2,
        rotation: (Math.random() - 0.5) * 0.3,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(Math.random() * height));
    }

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      const repulsionRadius = 140; // Pixels radius for cursor repulsion

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Cursor Repulsion Physics ("cursor le jane pe wo cursor se bhagenge")
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repulsionRadius && dist > 0) {
            const force = (repulsionRadius - dist) / repulsionRadius;
            const angle = Math.atan2(dy, dx);
            const repelStrength = force * 6.5;

            p.vx += Math.cos(angle) * repelStrength;
            p.vy += Math.sin(angle) * repelStrength;
          }
        }

        // Apply friction and restore natural drift
        p.vx *= 0.92;
        p.vy = p.vy * 0.92 + p.baseSpeedY * 0.08;

        // Apply horizontal gentle wobble
        const wobble = Math.sin(time * p.wobbleSpeed + p.wobbleOffset) * p.wobbleAmount;

        p.x += p.vx + wobble;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Respawn when letter floats above top of screen
        if (p.y < -50) {
          p.y = height + Math.random() * 40;
          p.x = Math.random() * width;
          p.vx = 0;
          p.vy = p.baseSpeedY;
          p.char = HINDI_LETTERS[Math.floor(Math.random() * HINDI_LETTERS.length)];
          p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        }

        // Keep within horizontal bounds
        if (p.x < -30) p.x = width + 20;
        if (p.x > width + 30) p.x = -20;

        // Draw the Hindi letter
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `bold ${Math.round(p.size)}px 'Noto Sans Devanagari', 'Segoe UI', sans-serif`;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] select-none"
      aria-hidden="true"
    />
  );
};
