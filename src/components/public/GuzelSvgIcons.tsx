import React from 'react';

export function GuzelLogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" fill="currentColor" className={className} aria-hidden="true">
      <rect x="20" y="2" width="16" height="16" rx="4" transform="rotate(45 28 10)" opacity="1" />
      <rect x="34" y="16" width="16" height="16" rx="4" transform="rotate(45 42 24)" opacity="0.55" />
      <rect x="6" y="16" width="16" height="16" rx="4" transform="rotate(45 14 24)" opacity="0.8" />
      <rect x="20" y="30" width="16" height="16" rx="4" transform="rotate(45 28 38)" opacity="0.35" />
    </svg>
  );
}

export function GuzelSpinIcon({ className = 'w-8 h-8' }: { className?: string }) {
  const steps = [
    { deg: 0, op: 1 },
    { deg: 45, op: 0.3 },
    { deg: 90, op: 0.6 },
    { deg: 135, op: 0.2 },
    { deg: 180, op: 0.4 },
    { deg: 225, op: 0.5 },
    { deg: 270, op: 0.8 },
    { deg: 315, op: 0.1 },
  ];
  return (
    <svg viewBox="0 0 56 56" fill="currentColor" className={className} aria-hidden="true">
      {steps.map((s) => (
        <rect
          key={s.deg}
          x="25"
          y="4"
          width="6"
          height="14"
          rx="3"
          transform={`rotate(${s.deg} 28 28)`}
          opacity={s.op}
        />
      ))}
    </svg>
  );
}

export function GuzelSparkIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16 4C16 11.5 20.5 14 26 14C20.5 14 16 16.5 16 24C16 16.5 11.5 14 6 14C11.5 14 16 11.5 16 4Z" />
      <circle cx="25" cy="25" r="2.2" />
      <circle cx="7" cy="7" r="1.6" />
    </svg>
  );
}
