import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

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
    <div
      className="flex flex-col items-start justify-between gap-4 rounded-3xl border p-6 sm:p-7 backdrop-blur-xl md:flex-row md:items-center"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.86)',
        borderColor: 'rgba(58, 29, 67, 0.09)',
        boxShadow: '0 14px 40px -18px rgba(58, 29, 67, 0.1)',
      }}
    >
      <div>
        {eyebrow && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e6f0] border border-[#e8d7e4] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#73358c]">
            <Sparkles className="h-3 w-3 text-[#b14bd9]" />
            {eyebrow}
          </span>
        )}
        <h1 className="heading-display mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-[#3a1d43]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-[#3a1d43]/65 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
