// app/components/ScrollReveal.tsx
'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number; // delay in milliseconds
}

export default function ScrollReveal({ children, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('opacity-100', 'translate-y-0');
          el.classList.remove('opacity-0', 'translate-y-10');
        } else {
          // Optional: hides again when out of view (you can keep or remove this)
          el.classList.remove('opacity-100', 'translate-y-0');
          el.classList.add('opacity-0', 'translate-y-10');
        }
      },
      { threshold: 0.1 }
    );

    // Initial state with transition
    el.classList.add('opacity-0', 'translate-y-10', 'transition-all', 'duration-700', 'ease-out');
    // Apply delay via inline style (Tailwind can't handle dynamic delays easily)
    el.style.transitionDelay = `${delay}ms`;

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return <div ref={ref}>{children}</div>;
}