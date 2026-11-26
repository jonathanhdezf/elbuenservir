import React, { useEffect, useRef, useState } from 'react';

interface AnimatedSloganProps {
  className?: string;
  withQuotes?: boolean;
}

export const AnimatedSlogan: React.FC<AnimatedSloganProps> = ({
  className = '',
  withQuotes = false,
}) => {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showFirstPart, setShowFirstPart] = useState(false);
  const [showSecondPart, setShowSecondPart] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      setShowFirstPart(true);
      setShowSecondPart(true);
      return;
    }

    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !isVisible) return;

    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let tReset: ReturnType<typeof setTimeout>;
    let tLoop: ReturnType<typeof setTimeout>;

    const runSequence = () => {
      setShowFirstPart(false);
      setShowSecondPart(false);

      t1 = setTimeout(() => {
        setShowFirstPart(true);
      }, 250);

      t2 = setTimeout(() => {
        setShowSecondPart(true);
      }, 2200);

      tReset = setTimeout(() => {
        setShowFirstPart(false);
        setShowSecondPart(false);
      }, 7600);

      tLoop = setTimeout(runSequence, 8800);
    };

    runSequence();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(tReset);
      clearTimeout(tLoop);
    };
  }, [isVisible]);

  return (
    <span
      ref={containerRef}
      className={`inline-flex flex-wrap items-baseline gap-x-1.5 ${className}`}
      aria-label="¡Todo bien, todo rico!"
    >
      <span
        className={`inline-block transition-all duration-[1400ms] ease-out ${
          showFirstPart
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-1.5'
        }`}
      >
        {withQuotes ? '"¡Todo bien,' : '¡Todo bien,'}
      </span>
      <span
        className={`inline-block transition-all duration-[1500ms] ease-out ${
          showSecondPart
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-1.5'
        }`}
      >
        {withQuotes ? 'todo rico!"' : 'todo rico!'}
      </span>
    </span>
  );
};

export default AnimatedSlogan;
