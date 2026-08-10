// app/components/AnimatedCounter.tsx
'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  target: number;
  label: string;
}

export default function AnimatedCounter({ target, label }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const step = Math.max(1, Math.floor(target / 60));
          const interval = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(interval);
            } else {
              setCount(start);
            }
          }, 30);
          return () => clearInterval(interval);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', fontWeight: 700, color: '#C8A87C',}}>
        {count}+
      </div>
      <div style={{ fontSize: '0.9rem', color: '#666666', fontWeight: 500, marginTop: '0.25rem',}}>
        {label}
      </div>
    </div>
  );
}