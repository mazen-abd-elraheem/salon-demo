import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReshootPage() {
  useEffect(() => {
    document.title = 'Reshoot — AI Beauty Photography';
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#090D16] overflow-hidden">
      {/* Return back to salon bar */}
      <div className="absolute top-4 left-4 z-50">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-xs text-white transition-all shadow-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Maison Lumière</span>
        </Link>
      </div>

      <iframe
        src="/reshoot.html"
        title="Reshoot AI Beauty Photography Studio"
        className="w-full h-full border-0"
      />
    </div>
  );
}

