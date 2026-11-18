import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  r: number;
  phase: number;
  drift: number;
}

interface Shooter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
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
    let shooters: Shooter[] = [];

    const spawn = (): Shooter => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.2,
      vx: 0.5 + Math.random() * 1.4,
      vy: 1.2 + Math.random() * 2.2,
      life: 0,
      max: 120 + Math.random() * 100,
    });

    const build = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(170, Math.max(50, Math.floor((width * height) / 14500)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.2 + Math.random() * 0.8,
        r: 0.4 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        drift: 0.02 + Math.random() * 0.08,
      }));
      shooters = Array.from({ length: 3 }, spawn);
    };

    const draw = (time: number, moving: boolean) => {
      pointerX += (targetX - pointerX) * 0.03;
      pointerY += (targetY - pointerY) * 0.03;
      ctx.clearRect(0, 0, width, height);

      const points = particles.map((particle, index) => {
        const twinkle = 0.25 + Math.abs(Math.sin(time * 0.00045 + particle.phase)) * 0.75;
        const x = particle.x + Math.sin(time * 0.00013 * particle.z + particle.phase) * 18 + pointerX * particle.z * 0.5;
        const y = particle.y + Math.cos(time * 0.00017 * particle.z + particle.phase) * 12 + pointerY * particle.z * 0.5;
        return { x, y, z: particle.z, r: particle.r, twinkle, index };
      });

      // A faint constellation web between nearby particles.
      for (let i = 0; i < points.length; i += 1) {
        const point = points[i];
        for (let j = i + 1; j < Math.min(points.length, i + 8); j += 1) {
          const other = points[j];
          const dx = point.x - other.x;
          const dy = point.y - other.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 118 || distance < 8) continue;
          const alpha = (1 - distance / 118) * 0.08 * Math.min(point.z, other.z);
          ctx.strokeStyle = `rgba(96, 120, 255, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }

      for (const point of points) {
        const alpha = point.twinkle * (0.25 + point.z * 0.5);
        ctx.beginPath();
        ctx.fillStyle = point.z > 0.72
          ? `rgba(190, 205, 255, ${alpha})`
          : `rgba(70, 92, 255, ${alpha})`;
        ctx.arc(point.x, point.y, point.r * (0.7 + point.z * 0.6), 0, Math.PI * 2);
        ctx.fill();
        if (point.z > 0.86 && point.twinkle > 0.82) {
          ctx.strokeStyle = `rgba(170, 190, 255, ${alpha * 0.35})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(point.x - point.r * 3, point.y);
          ctx.lineTo(point.x + point.r * 3, point.y);
          ctx.moveTo(point.x, point.y - point.r * 3);
          ctx.lineTo(point.x, point.y + point.r * 3);
          ctx.stroke();
        }
      }

      if (!moving) return;
      shooters.forEach((shooter, index) => {
        shooter.life += 1;
        shooter.x += shooter.vx;
        shooter.y += shooter.vy;
        if (shooter.life > shooter.max || shooter.y > height + 40 || shooter.x > width + 40) {
          shooters[index] = spawn();
          return;
        }
        const fade = Math.sin((shooter.life / shooter.max) * Math.PI);
        const tail = 80 + shooter.life * 0.4;
        const gradient = ctx.createLinearGradient(
          shooter.x,
          shooter.y,
          shooter.x - shooter.vx * tail * 0.08,
          shooter.y - shooter.vy * tail * 0.08,
        );
        gradient.addColorStop(0, `rgba(214, 236, 255, ${fade * 0.55})`);
        gradient.addColorStop(1, "rgba(26, 178, 255, 0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(shooter.x, shooter.y);
        ctx.lineTo(
          shooter.x - shooter.vx * tail * 0.08,
          shooter.y - shooter.vy * tail * 0.08,
        );
        ctx.stroke();
      });
    };

    const loop = (time: number) => {
      draw(time, true);
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
      draw(1200, false);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onMove);
    };
  }, [motion]);

  return <canvas className="bg-particles" ref={canvasRef} aria-hidden="true" />;
}
