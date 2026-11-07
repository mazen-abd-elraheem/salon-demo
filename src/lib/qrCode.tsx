import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeProps {
  value: string;
  size?: number;
  label?: string;
  className?: string;
}

export function DynamicQRCode({ value, size = 200, label, className = '' }: QRCodeProps) {
  const [copied, setCopied] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
    value,
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-pearl/80 shadow-soft text-center ${className}`}>
      <div className="relative p-2 bg-ivory rounded-xl border border-pearl/60">
        <img
          src={qrUrl}
          alt={label || 'QR Code'}
          width={size}
          height={size}
          className="rounded-lg object-contain mx-auto"
          loading="lazy"
        />
      </div>
      {label && <p className="mt-2.5 text-xs font-medium text-mocha-600">{label}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-mocha-400/20 bg-pearl/40 hover:bg-pearl/80 text-xs font-medium text-espresso transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-rosegold-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
        </button>
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-mocha-400/20 bg-pearl/40 hover:bg-pearl/80 text-xs font-medium text-espresso transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>فتح</span>
        </a>
      </div>
    </div>
  );
}

