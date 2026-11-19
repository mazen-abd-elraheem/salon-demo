import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { sanitizeSafeUrl } from './security';

interface QRCodeProps {
  value: string;
  size?: number;
  label?: string;
  className?: string;
}

export function DynamicQRCode({ value, size = 200, label, className = '' }: QRCodeProps) {
  const [copied, setCopied] = useState(false);
  const safeHref = sanitizeSafeUrl(value, '#');
  const clampedSize = Math.min(400, Math.max(100, Math.round(size)));
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${clampedSize}x${clampedSize}&margin=10&data=${encodeURIComponent(
    safeHref,
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(safeHref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-[#e8d7e4] shadow-[0_12px_32px_-16px_rgba(58,29,67,0.12)] text-center ${className}`}
    >
      <div className="relative p-2.5 bg-[#f9f0f5] rounded-2xl border border-[#cbb6ea]/60">
        <img
          src={qrUrl}
          alt={label || 'QR Code'}
          width={clampedSize}
          height={clampedSize}
          className="rounded-xl object-contain mx-auto"
          loading="lazy"
          decoding="async"
        />
      </div>
      {label && <p className="mt-2.5 text-xs font-semibold text-[#3a1d43]/75">{label}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#e8d7e4] bg-[#f9f0f5] hover:bg-[#f3e6f0] text-xs font-bold text-[#3a1d43] transition cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#73358c]" />}
          <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
        </button>
        {safeHref !== '#' && (
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[#cbb6ea] bg-[#f3e6f0] hover:bg-[#cbb6ea]/55 text-xs font-bold text-[#3a1d43] transition no-underline"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#73358c]" />
            <span>فتح</span>
          </a>
        )}
      </div>
    </div>
  );
}
