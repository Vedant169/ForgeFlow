import React, { useEffect, useRef } from 'react';

/**
 * NavbarSmoke Component
 * Renders atmospheric, drifting smoke texture particles specifically tailored for the navbar.
 * Matches the procedural smoke dynamics of SmokeBackground, harmonized for translucent #E5D3AF glass.
 */
export function NavbarSmoke({ density = 14 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 80;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Particle Cloud Definition for the navbar horizontal strip
    const clouds = [];
    const palette = [
      { r: 80, g: 100, b: 236, a: 0.12 },  // FlowForge Indigo wisp
      { r: 61, g: 217, b: 178, a: 0.09 },  // Emerald mist
      { r: 188, g: 195, b: 255, a: 0.14 }, // Lavender wisp
      { r: 245, g: 235, b: 215, a: 0.22 }, // Soft ambient cream smoke
      { r: 60, g: 50, b: 35, a: 0.05 },    // Subtle depth shadow
    ];

    for (let i = 0; i < density; i++) {
      const color = palette[i % palette.length];
      clouds.push({
        x: Math.random() * (width || window.innerWidth),
        y: Math.random() * (height || 80),
        baseRadius: 60 + Math.random() * 90,
        vx: (Math.random() - 0.5) * 0.35 + 0.15, // Gentle rightward drift
        vy: (Math.random() - 0.5) * 0.15,
        color,
        pulseSpeed: 0.01 + Math.random() * 0.015,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      clouds.forEach((cloud, index) => {
        // Drift with harmonic waves
        cloud.x += cloud.vx + Math.sin(time + index * 0.8) * 0.4;
        cloud.y += cloud.vy + Math.cos(time * 0.8 + index * 0.6) * 0.2;

        // Wrap around boundaries
        if (cloud.x < -cloud.baseRadius) cloud.x = width + cloud.baseRadius;
        if (cloud.x > width + cloud.baseRadius) cloud.x = -cloud.baseRadius;
        if (cloud.y < -cloud.baseRadius) cloud.y = height + cloud.baseRadius;
        if (cloud.y > height + cloud.baseRadius) cloud.y = -cloud.baseRadius;

        // Billowing pulsation
        const currentRadius =
          cloud.baseRadius * (1 + Math.sin(time * cloud.pulseSpeed * 60 + cloud.pulseOffset) * 0.15);

        // Soft radial gradient
        const grad = ctx.createRadialGradient(
          cloud.x,
          cloud.y,
          0,
          cloud.x,
          cloud.y,
          currentRadius
        );

        const { r, g, b, a } = cloud.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${a * 0.45})`);
        grad.addColorStop(1, 'rgba(229, 211, 175, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-90"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}

export default NavbarSmoke;
