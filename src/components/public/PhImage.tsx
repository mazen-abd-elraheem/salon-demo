import React, { useEffect, useRef, useState } from 'react';
import { computeCoverCropStyles } from '../../lib/reshootMedia';

interface PhImageProps {
  imgKey: string;
  fx?: number;
  fy?: number;
  customImageUrl?: string | null;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

type ResizeCallback = () => void;
const observerMap = new WeakMap<Element, ResizeCallback>();
let sharedObserver: ResizeObserver | null = null;

function getSharedObserver(): ResizeObserver | null {
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
    return null;
  }
  if (!sharedObserver) {
    sharedObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cb = observerMap.get(entry.target);
        if (cb) cb();
      }
    });
  }
  return sharedObserver;
}

export default function PhImage({
  imgKey,
  fx = 0.5,
  fy = 0.5,
  customImageUrl,
  className = '',
  style,
  children,
}: PhImageProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [cropStyle, setCropStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      const ew = el.offsetWidth;
      const eh = el.offsetHeight;
      if (ew <= 0 || eh <= 0) return;
      const computed = computeCoverCropStyles(imgKey, ew, eh, fx, fy, customImageUrl);
      if (computed) {
        setCropStyle(computed);
      }
    };

    fit();
    const obs = getSharedObserver();
    if (obs) {
      observerMap.set(el, fit);
      obs.observe(el);
    }

    return () => {
      if (obs && el) {
        obs.unobserve(el);
        observerMap.delete(el);
      }
    };
  }, [imgKey, fx, fy, customImageUrl]);

  return (
    <div
      ref={ref}
      data-img={imgKey}
      data-fx={fx !== 0.5 ? fx : undefined}
      data-fy={fy !== 0.5 ? fy : undefined}
      className={`ph ${className}`.trim()}
      style={{
        backgroundColor: 'var(--secondbg, #f3e6f0)',
        backgroundRepeat: 'no-repeat',
        ...cropStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

