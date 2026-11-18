import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  r: number;
  phase: number;
  drift: number;
}

export function BackgroundFX({ motion }: { motion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let raf = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let particles: Particle[] = [];

    const build = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(140, Math.max(40, Math.floor((width * height) / 16000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.2 + Math.random() * 0.8,
        r: 0.4 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        drift: 0.02 + Math.random() * 0.08,
      }));
    };

    const draw = (time: number) => {
      pointerX += (targetX - pointerX) * 0.03;
      pointerY += (targetY - pointerY) * 0.03;
      ctx.clearRect(0, 0, width, height);
      for (const particle of particles) {
        const twinkle = 0.25 + Math.abs(Math.sin(time * 0.00045 + particle.phase)) * 0.75;
        const x = particle.x + Math.sin(time * 0.00013 * particle.z + particle.phase) * 18 + pointerX * particle.z * 0.5;
        const y = particle.y + Math.cos(time * 0.00017 * particle.z + particle.phase) * 12 + pointerY * particle.z * 0.5;
        const alpha = twinkle * (0.25 + particle.z * 0.5);
        ctx.beginPath();
        ctx.fillStyle = particle.z > 0.72
          ? `rgba(190, 205, 255, ${alpha})`
          : `rgba(70, 92, 255, ${alpha})`;
        ctx.arc(x, y, particle.r * (0.7 + particle.z * 0.6), 0, Math.PI * 2);
        ctx.fill();
        if (particle.z > 0.86 && twinkle > 0.82) {
          ctx.strokeStyle = `rgba(170, 190, 255, ${alpha * 0.35})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x - particle.r * 3, y);
          ctx.lineTo(x + particle.r * 3, y);
          ctx.moveTo(x, y - particle.r * 3);
          ctx.lineTo(x, y + particle.r * 3);
          ctx.stroke();
        }
      }
    };

    const loop = (time: number) => {
      draw(time);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (event: PointerEvent) => {
      targetX = (event.clientX / width - 0.5) * 36;
      targetY = (event.clientY / height - 0.5) * 24;
    };

    build();
    window.addEventListener("resize", build);
    window.addEventListener("pointermove", onMove, { passive: true });
    if (motion) {
      raf = requestAnimationFrame(loop);
    } else {
      draw(1200);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onMove);
    };
  }, [motion]);

  return <canvas className="bg-particles" ref={canvasRef} aria-hidden="true" />;
}
