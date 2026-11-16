import { type ReactNode, useEffect, useRef, useState } from "react";

/** Adds `.is-in` the first time the element is seen. CSS owns the motion, so
 * both motion-off channels leave the final state visible without JS. */
export function Reveal({
  className = "",
  delay = 0,
  threshold = 0.12,
  children,
}: {
  className?: string;
  delay?: number;
  threshold?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || shown) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shown, threshold]);

  return (
    <div
      ref={ref}
      className={`reveal${shown ? " is-in" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
