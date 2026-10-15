import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Fades and lifts children into view the first time they scroll on screen. */
export function Reveal({ children, as: Tag = 'div', className = '', delay = 0, ...rest }: { children: ReactNode; as?: ElementType; className?: string; delay?: number; [k: string]: unknown }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal${shown ? ' is-shown' : ''} ${className}`} style={{ ['--delay' as string]: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

/** Counts up to a number when it first renders or changes. */
export function CountUp({ value, duration = 900, format = (n: number) => Math.round(n).toLocaleString('en-US') }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(prefersReducedMotion() ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format(shown)}</>;
}

/** True one frame after mount, so CSS transitions (bar widths, rings) animate from zero. */
export function useMountedFlag(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setM(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return m;
}
