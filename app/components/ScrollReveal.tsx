'use client';

import { useEffect, useRef } from 'react';

export default function ScrollReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // ✅ Element enters viewport → fade in
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        } else {
          // ✅ Element leaves viewport → fade out (so it will re‑animate next time)
          el.style.opacity = '0';
          el.style.transform = 'translateY(30px)';
        }
      },
      { threshold: 0.1 }
    );

    // Initial hidden state
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition =
      `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`;

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return <div ref={ref}>{children}</div>;
}