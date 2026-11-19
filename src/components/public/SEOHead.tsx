import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

interface SEOHeadProps {
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
}

export default function SEOHead({
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
}: SEOHeadProps) {
  const { lang } = useLanguage();
  const { pathname } = useLocation();

  useEffect(() => {
    const defaultTitleAr = 'جوزال ميديكال سبا | Guzel Medical Spa — العناية الطبية والتجميل والسبا';
    const defaultTitleEn = 'Guzel Medical Spa | جوزال ميديكال سبا — Luxury Medical Spa & Beauty';
    const defaultDescAr =
      'جوزال ميديكال سبا (Guzel Medical Spa) — أرقى جلسات الهيدرا فيشل، الحمام المغربي الملكي، المساج العلاجي، وباقات العروسة المتكاملة في مصر. احجزي موعدك أونلاين.';
    const defaultDescEn =
      'Discover ultimate tranquility and clinical beauty at Guzel Medical Spa. Explore rejuvenating HydraFacials, Moroccan Hammam, soothing massages, and signature skincare.';

    const finalTitle =
      lang === 'ar'
        ? titleAr
          ? `${titleAr} | جوزال ميديكال سبا`
          : defaultTitleAr
        : titleEn
        ? `${titleEn} | Guzel Medical Spa`
        : defaultTitleEn;

    const finalDesc =
      lang === 'ar' ? descriptionAr || defaultDescAr : descriptionEn || defaultDescEn;

    document.title = finalTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', finalDesc);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', finalTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', finalDesc);
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://guzelspa.beauty${pathname === '/' ? '/' : pathname}`);
    }
  }, [lang, pathname, titleAr, titleEn, descriptionAr, descriptionEn]);

  return null;
}
