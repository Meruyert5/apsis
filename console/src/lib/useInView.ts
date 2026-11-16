import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One-shot visibility. Attach `ref` to the element; `shown` flips true the
 * first time it enters the viewport at `threshold` and stays true.
 */
export function useInView(threshold = 0.2): {
  ref: (node: HTMLElement | null) => void;
  shown: boolean;
} {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [shown, setShown] = useState(false);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node) return;
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
      observerRef.current = observer;
    },
    [threshold],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, shown };
}
