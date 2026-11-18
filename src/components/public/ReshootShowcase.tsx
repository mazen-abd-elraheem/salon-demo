import { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Maximize2,
  ExternalLink,
  Layers,
  Camera,
  Palette,
  Sliders,
  Download,
} from 'lucide-react';
import { PhImage } from './PhImage';
import { useLanguage } from '../../context/LanguageContext';
import type { Service } from '../../lib/types';

interface ReshootShowcaseProps {
  onSelectService?: (service: Service) => void;
  onBook?: () => void;
}

export default function ReshootShowcase({ onSelectService, onBook }: ReshootShowcaseProps) {
  const { lang, isRTL } = useLanguage();
  const [selectedCells, setSelectedCells] = useState<number[]>([1, 4, 7]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [generatedCount, setGeneratedCount] = useState<number>(24);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const toggleCell = (index: number) => {
    setSelectedCells((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleGenerateMore = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedCount((c) => c + 4);
      setIsGenerating(false);
    }, 600);
  };

  // Section 3: 5x2 dashboard images
  const dashboardCells = [
    { id: 0, img: 'styled:0', label: 'Silk Ripple & Dropper' },
    { id: 1, img: 'studio:0', label: 'Porcelain Serum Studio' },
    { id: 2, img: 'styled:1', label: 'Frosted Glass Macro' },
    { id: 3, img: 'life:1', label: 'Morning Silk Robe' },
    { id: 4, img: 'styled2:3', label: 'Minimalist Pedestal' },
    { id: 5, img: 'ringa:1', label: 'Cheekbone Dew Drop' },
    { id: 6, img: 'styled2:0', label: 'Water Ripple Flatlay' },
    { id: 7, img: 'life:3', label: 'Editorial Smile & Glow' },
    { id: 8, img: 'styled:4', label: 'Marble Backlight' },
    { id: 9, img: 'studio:1', label: 'High-Key Studio Close' },
  ];

  // Section 2: Marquee wordmarks
  const wordmarks = [
    'AURA',
    'LUMEN',
    'LIRAE',
    'DEWLAB',
    'PETALÉ',
    'NUDO',
    'VELVET',
    'SOLARIS',
    'GLOWIST',
    'ÉLAN',
  ];

  // Section 4: 4 Steps
  const steps = useMemo(
    () => [
      {
        num: '01',
        titleEn: 'Add products and looks.',
        titleAr: 'أضيفي منتجاتكِ والستايل.',
        gradientBg: 'from-[#eef3ff] to-[#dbe4ff]',
        darkBg: 'from-[#0d1424] to-[#121c33]',
        badgeEn: '20+ Model presets',
        badgeAr: 'أكثر من ٢٠ نموذج وجه',
        descEn: 'Stack your products, faces and skin tones side by side.',
        descAr: 'نسقي منتجاتكِ، درجات البشرة والإضاءة جنباً إلى جنب باحترافية كاملة.',
        cards: [
          { img: 'studio:0', tag: 'Face Preset', title: 'Lumière Glow' },
          { img: 'styled:1', tag: 'Skin Texture', title: 'Dewy Hydration' },
          { img: 'faces:1', tag: 'Lighting', title: 'Soft Diffusion' },
          { img: 'styled2:0', tag: 'Macro Detail', title: 'Droplet Focus' },
        ],
      },
      {
        num: '02',
        titleEn: 'Pick art direction and models.',
        titleAr: 'حددي التوجه الفني والموديلز.',
        gradientBg: 'from-[#f5eeff] to-[#e3d5ff]',
        darkBg: 'from-[#170e28] to-[#241540]',
        badgeEn: '6 Diverse faces',
        badgeAr: '٦ وجوه متنوعة بملامح طبيعية',
        descEn: 'Editorial lighting presets and high-fashion poses calibrated for beauty.',
        descAr: 'إعدادات إضاءة تحريرية ووضعيات عارضات أزياء فائقة الدقة مخصصة لمجال التجميل.',
        cards: [
          { img: 'faces:0', tag: 'Model 01', title: 'Olive Tone & Freckles' },
          { img: 'faces:2', tag: 'Model 02', title: 'Porcelain & Sleek Bun' },
          { img: 'faces:3', tag: 'Model 03', title: 'Golden Hour Radiance' },
          { img: 'faces:4', tag: 'Model 04', title: 'Minimalist Chic' },
        ],
      },
      {
        num: '03',
        titleEn: 'Generate in seconds.',
        titleAr: 'توليد فوري خلال ثوانٍ معدودة.',
        gradientBg: 'from-[#fff0f2] to-[#fedee1]',
        darkBg: 'from-[#240e15] to-[#3a1522]',
        badgeEn: 'Sub-second synthesis',
        badgeAr: 'توليد فائق السرعة بدقة مجهرية',
        descEn: 'Proprietary diffusion pipeline preserves your exact bottle geometry and typography.',
        descAr: 'خوارزميات ذكاء اصطناعي تحافظ بدقة على أبعاد العبوات ونصوص الملصقات بدقة ١٠٠٪.',
        cards: [
          { img: 'ringa:1', tag: 'Editorial', title: 'High Cheek Glow' },
          { img: 'life:1', tag: 'In-Context', title: 'Morning Silk Routine' },
          { img: 'styled:4', tag: 'Texture Sweep', title: 'Water Shimmer' },
          { img: 'ringb:1', tag: 'Flat Lay', title: 'Dewy Reflection' },
        ],
      },
      {
        num: '04',
        titleEn: 'Export campaign-ready assets.',
        titleAr: 'تصدير صور جاهزة للحملات فوراً.',
        gradientBg: 'from-[#fdf3ec] to-[#f7dfd4]',
        darkBg: 'from-[#29170e] to-[#3d2315]',
        badgeEn: '4K TIFF & WebP',
        badgeAr: 'جودة 4K فائقة الوضوح',
        descEn: 'High-resolution master crops with transparent layers, color profiles and social ratios.',
        descAr: 'تنسيقات متعددة لصفحات المنتجات وإعلانات إنستغرام وتيك توك بدقة طباعة فائقة.',
        cards: [
          { img: 'styled2:3', tag: 'Hero Banner', title: '16:9 Master View' },
          { img: 'ringa:0', tag: 'E-Commerce PDP', title: '3:4 Catalog Tile' },
          { img: 'ringb:2', tag: 'Social Story', title: '9:16 Vertical Reel' },
          { img: 'life:3', tag: 'Print Campaign', title: '4:5 Editorial Poster' },
        ],
      },
    ],
    []
  );

  return (
    <section id="reshoot-showcase" className="relative py-24 bg-[#090D16] text-[#F8FAFC] overflow-hidden">
      {/* Background radial atmosphere */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#9333ea]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#f43f5e]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section 2: How It Works & Marquee Bar */}
        <div className="mb-20 pb-16 border-b border-white/[0.08]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-mono uppercase tracking-wider text-[#d8b4fe] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
                <span>{lang === 'ar' ? 'استوديو ريشوت بالذكاء الاصطناعي' : 'Reshoot Studio · AI Beauty'}</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
                {lang === 'ar' ? (
                  <>
                    من فكرة المنتج إلى{' '}
                    <span className="font-serif italic text-[#f472b6]">أرقى الصور</span>{' '}
                    الإعلانية.
                  </>
                ) : (
                  <>
                    From your product idea to{' '}
                    <span className="font-serif italic text-[#f472b6]">on-brand</span>{' '}
                    editorial shoots.
                  </>
                )}
              </h2>
            </div>

            {/* Masked crawling pill traits */}
            <div className="flex flex-wrap gap-2.5">
              {[
                lang === 'ar' ? 'نعومة بشرة سينمائية' : 'Editorial skin glow',
                lang === 'ar' ? 'فيزياء إضاءة واقعية' : 'Studio lighting physics',
                lang === 'ar' ? 'تفاصيل بدقة مجهرية' : 'High-fidelity textures',
              ].map((phrase, i) => (
                <div
                  key={i}
                  className="px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm text-slate-300 backdrop-blur-md"
                >
                  {phrase}
                </div>
              ))}
            </div>
          </div>

          {/* Marquee wordmarks */}
          <div className="pt-4">
            <div className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4">
              {lang === 'ar' ? 'معتمد وموثوق من أرقى بيوت التجميل' : 'Trusted by beauty innovators'}
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {wordmarks.map((brand, i) => (
                <div
                  key={i}
                  className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-mono font-medium tracking-wider text-slate-300 transition-colors duration-200"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: AI Beauty Photoshoots (70rem Panel Equivalent) */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#13111C] to-[#0A0812] border border-white/[0.1] p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden mb-24">
          {/* Top Tag & Spark Button */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1e1b2e] border border-purple-500/30 text-xs text-purple-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#c084fc] animate-pulse" />
              <span>{lang === 'ar' ? 'جلسات تصوير الذكاء الاصطناعي للبشرة' : 'AI Beauty Photoshoots'}</span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/reshoot.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs text-slate-200 transition-all font-mono"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#c084fc]" />
                <span>{lang === 'ar' ? 'عرض الاستوديو الكامل 3D' : 'Launch Full 3D Page'}</span>
              </a>
              <button
                onClick={onBook}
                className="w-10 h-10 rounded-full bg-white hover:bg-white/90 text-slate-900 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                title={lang === 'ar' ? 'احجزي جلستكِ' : 'Book a Shoot Session'}
                aria-label="Spark action"
              >
                <Sparkles className="w-4 h-4 text-[#9333ea]" />
              </button>
            </div>
          </div>

          {/* Desktop Showcase Strip: Input Card -> Arrow -> Dark Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-10">
            {/* Input Packshot Card */}
            <div className="lg:col-span-3 flex flex-col items-center">
              <div className="w-full max-w-[280px] rounded-2xl overflow-hidden border border-white/[0.12] bg-[#1a1726] shadow-xl group">
                <div className="p-3 border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>INPUT_01.RAW</span>
                  <span className="text-[#c084fc]">● LIVE</span>
                </div>
                <div className="aspect-[3/4] relative">
                  <PhImage img="base:0" className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-xs text-white">Lunelle Frosted Dropper (Packshot)</span>
                  </div>
                </div>
                <div className="p-3 bg-black/40 text-[11px] text-slate-300">
                  {lang === 'ar' ? 'صورة واحدة للمنتج على خلفية بيضاء' : 'Single raw product photo on plain background'}
                </div>
              </div>
            </div>

            {/* Direction Arrow */}
            <div className="lg:col-span-1 flex justify-center py-2 lg:py-0">
              <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-slate-300">
                <ArrowIcon className="w-5 h-5 text-[#c084fc] animate-pulse" />
              </div>
            </div>

            {/* Dark Generated Photos Dashboard */}
            <div className="lg:col-span-8 rounded-2xl bg-[#09070F] border border-white/[0.1] p-5 sm:p-6 shadow-2xl">
              {/* Dashboard Head */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-base font-medium text-white flex items-center gap-2">
                    {lang === 'ar' ? 'الصور المولدة للحملة' : 'Generated photos'}
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-[#d8b4fe] border border-purple-500/30">
                      {selectedCells.length} / 10 Selected
                    </span>
                  </h4>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Lunelle Serum · 10 of {generatedCount}
                  </p>
                </div>

                <button
                  onClick={handleGenerateMore}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-mono transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? (lang === 'ar' ? 'جارٍ التوليد...' : 'Synthesizing...') : (lang === 'ar' ? '✦ توليد المزيد' : '✦ Generate more')}</span>
                </button>
              </div>

              {/* 5x2 Grid of 3:4 Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {dashboardCells.map((cell) => {
                  const isSel = selectedCells.includes(cell.id);
                  return (
                    <button
                      key={cell.id}
                      onClick={() => toggleCell(cell.id)}
                      className={`group relative aspect-[3/4] rounded-xl overflow-hidden border text-left transition-all duration-200 cursor-pointer ${
                        isSel
                          ? 'border-[#c084fc] ring-2 ring-[#c084fc]/40 scale-[1.02]'
                          : 'border-white/[0.08] hover:border-white/30 opacity-75 hover:opacity-100'
                      }`}
                      title={cell.label}
                    >
                      <PhImage img={cell.img} className="w-full h-full" />
                      
                      {/* Check badge */}
                      <div
                        className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSel
                            ? 'bg-[#c084fc] text-slate-900 shadow-md'
                            : 'bg-black/40 text-transparent border border-white/20 group-hover:border-white/60'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>

                      {/* Hover label overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate font-sans">{cell.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{lang === 'ar' ? 'انقري على أي صورة لتحديدها أو استبعادها' : 'Click any photo to select or deselect for export'}</span>
                <span className="text-[#c084fc]">{selectedCells.length} assets ready</span>
              </div>
            </div>
          </div>

          {/* Bottom Heading & Description */}
          <div className="max-w-3xl pt-6 border-t border-white/[0.08]">
            <h3 className="text-2xl sm:text-4xl font-light text-white leading-tight mb-3">
              {lang === 'ar' ? (
                <>
                  جلسات تصوير بجودة الحملات العالمية،<br />
                  <span className="font-serif italic text-[#f472b6]">دون الحاجة لفريق تصوير كامل.</span>
                </>
              ) : (
                <>
                  Campaign-grade,<br />
                  <span className="font-serif italic text-[#f472b6]">with no photo crew.</span>
                </>
              )}
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
              {lang === 'ar'
                ? 'ارفعي صورة واحدة لعبوتكِ واحصل على كل زاوية، لمعة، إضاءة وأجواء مخصصة لصفحات المنتجات وحملات الإطلاق فوراً دون استوديو أو رتوش معقدة.'
                : 'Upload one serum and get every angle, glow, light and mood ready for PDPs and launches, no studio and no retouching.'}
            </p>
          </div>
        </div>

        {/* Section 4: Four Steps Showcase */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-mono uppercase tracking-wider text-[#d8b4fe] mb-2">
                <Layers className="w-3.5 h-3.5 text-[#c084fc]" />
                <span>{lang === 'ar' ? 'الخطوات الأربع المتكاملة' : 'The Four Steps'}</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-light text-white">
                {lang === 'ar' ? 'من الإعداد الأولي إلى الإطلاق العالمي' : 'Four steps to campaign-ready visuals.'}
              </h3>
            </div>

            {/* Step navigation tabs */}
            <div className="flex items-center gap-2 bg-white/[0.04] p-1.5 rounded-2xl border border-white/[0.08]">
              {steps.map((st, idx) => (
                <button
                  key={st.num}
                  onClick={() => setActiveStep(idx)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
                    activeStep === idx
                      ? 'bg-white text-slate-900 font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.num}
                </button>
              ))}
            </div>
          </div>

          {/* Active Step Panel */}
          {(() => {
            const currentStep = steps[activeStep];
            return (
              <div className="rounded-3xl bg-gradient-to-br from-[#12101B] via-[#0F0D17] to-[#0A0811] border border-white/[0.1] p-6 sm:p-10 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-8 mb-8 border-b border-white/[0.08]">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-[#d8b4fe] mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]" />
                      <span>{lang === 'ar' ? currentStep.badgeAr : currentStep.badgeEn}</span>
                    </div>
                    <h4 className="text-2xl sm:text-3xl font-light text-white mb-2">
                      {lang === 'ar' ? currentStep.titleAr : currentStep.titleEn}
                    </h4>
                    <p className="text-sm text-slate-300 font-light max-w-xl">
                      {lang === 'ar' ? currentStep.descAr : currentStep.descEn}
                    </p>
                  </div>

                  <div className="text-5xl sm:text-7xl font-serif italic text-white/20 font-light select-none">
                    {currentStep.num}
                  </div>
                </div>

                {/* 4 Cards Grid with Glass Captions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentStep.cards.map((card, i) => (
                    <div
                      key={i}
                      className="group relative rounded-2xl overflow-hidden border border-white/[0.1] bg-[#14121F] aspect-[3/4] flex flex-col justify-end shadow-lg transition-transform duration-300 hover:-translate-y-1"
                    >
                      <PhImage img={card.img} className="absolute inset-0 w-full h-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="relative p-4 backdrop-blur-md bg-black/30 border-t border-white/[0.1] m-2 rounded-xl">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#d8b4fe] mb-0.5">
                          {card.tag}
                        </div>
                        <div className="text-xs font-medium text-white">{card.title}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer bar with direct actions */}
                <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-400 font-mono">
                    {lang === 'ar' ? 'جلسات تصوير مخصصة لمنتجات العناية والمكياج' : 'Engineered for skincare, cosmetic lines & ateliers'}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <a
                      href="/reshoot.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-xs font-mono text-white transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تجربة الاستوديو التفاعلي' : 'Open 3D Studio Page'}</span>
                    </a>

                    <button
                      onClick={onBook}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#c084fc] hover:bg-[#d8b4fe] text-slate-950 text-xs font-semibold shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'احجزي جلستكِ الآن' : 'Book Ritual Now'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}

