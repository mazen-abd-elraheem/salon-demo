import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-pearl/70 pb-8 md:flex-row md:items-end">
      <div>
        {eyebrow && (
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            {eyebrow}
          </span>
        )}
        <h1 className="heading-display mt-2 text-3xl md:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-sm text-mocha-600">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
