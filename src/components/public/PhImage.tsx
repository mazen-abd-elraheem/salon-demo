import { useEffect, useRef, useState, memo } from 'react';
import { computeCoverCropStyles, parseImgKey, SHEETS, getProxyUrl } from '../../lib/reshootMedia';

interface PhImageProps extends React.HTMLAttributes<HTMLDivElement> {
  img: string; // e.g. "styled:0", "base:0", "ringa:1"
  fx?: number;
  fy?: number;
  className?: string;
  children?: React.ReactNode;
}

export const PhImage = memo(function PhImage({
  img,
  fx = 0.5,
  fy = 0.5,
  className = '',
  style = {},
  children,
  ...rest
}: PhImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cropStyle, setCropStyle] = useState<React.CSSProperties>(() => {
    const { key } = parseImgKey(img);
    const sheet = SHEETS[key];
    return sheet
      ? {
          backgroundImage: `url("${getProxyUrl(sheet)}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      : {};
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateCrop = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) {
        const computed = computeCoverCropStyles(img, w, h, fx, fy);
        if (computed) {
          setCropStyle(computed);
        }
      }
    };

    updateCrop();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateCrop();
      });
      ro.observe(el);
    }

    return () => {
      if (ro) ro.disconnect();
    };
  }, [img, fx, fy]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden bg-[#131118]/20 ${className}`}
      style={{
        ...cropStyle,
        ...style,
      }}
      data-img={img}
      data-fx={fx}
      data-fy={fy}
      {...rest}
    >
      {children}
    </div>
  );
});

export default PhImage;

