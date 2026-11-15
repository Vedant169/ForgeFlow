import React, { useEffect, useRef } from 'react';

/**
 * SmokeBackground Component
 * Renders an atmospheric, drifting smoke texture throughout the entire page.
 * Seamlessly integrates with the page background and FlowForge ambient backlights.
 */
export function SmokeBackground({
  density = 24,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Particle Cloud Definition with soft, large volumetric puffs
    const clouds = [];
    const palette = [
      { r: 80, g: 100, b: 236, a: 0.05 },  // FlowForge Indigo
      { r: 61, g: 217, b: 178, a: 0.035 }, // Emerald accent
      { r: 94, g: 215, b: 233, a: 0.03 },  // Cyan wisp
      { r: 188, g: 195, b: 255, a: 0.04 }, // Lavender mist
    ];

    for (let i = 0; i < density; i++) {
      const color = palette[i % palette.length];
      clouds.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseRadius: 220 + Math.random() * 320,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.25,
        color,
        pulseSpeed: 0.008 + Math.random() * 0.012,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      clouds.forEach((cloud, index) => {
        // Gentle drift with smooth multi-harmonic waves
        cloud.x += cloud.vx + Math.sin(time + index * 0.7) * 0.3;
        cloud.y += cloud.vy + Math.cos(time * 0.7 + index * 0.5) * 0.25;

        // Seamless infinite wrap around viewport boundaries
        if (cloud.x < -cloud.baseRadius) cloud.x = width + cloud.baseRadius;
        if (cloud.x > width + cloud.baseRadius) cloud.x = -cloud.baseRadius;
        if (cloud.y < -cloud.baseRadius) cloud.y = height + cloud.baseRadius;
        if (cloud.y > height + cloud.baseRadius) cloud.y = -cloud.baseRadius;

        // Billowing pulsation
        const currentRadius =
          cloud.baseRadius * (1 + Math.sin(time * cloud.pulseSpeed * 60 + cloud.pulseOffset) * 0.1);

        // Soft, organic radial gradient
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
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${a * 0.4})`);
        grad.addColorStop(1, 'rgba(11, 12, 16, 0)');

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
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Ambient FlowForge Radial Backlights */}
      <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[1100px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(80,100,236,0.14)_0%,rgba(61,217,178,0.05)_45%,transparent_75%)] blur-3xl pointer-events-none" />
      <div className="absolute top-48 left-1/4 w-80 h-80 rounded-full bg-[#5ed7e9]/10 blur-3xl pointer-events-none" />

      {/* Fullscreen Procedural Smoke Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
      />
    </div>
  );
}

export default SmokeBackground;
