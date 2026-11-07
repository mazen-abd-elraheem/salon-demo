// Centralized image URLs so they're easy to swap later.
// All sources are high-quality Unsplash photos with consistent beauty-salon framing.

export const heroImages = {
  primary:
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
  // Soft secondary used in floating frame
  secondary:
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
  // Tone-on-tone product still life
  tertiary:
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=80',
};

export const aboutImages = {
  studio:
    'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1400&q=80',
  consultation:
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80',
};

// Niche-specific service fallback images, keyed by lowercased keywords found in service names.
// Used when a service doesn't have its own image attached in the database.
export const serviceImageMap: { keywords: string[]; url: string; alt: string }[] = [
  {
    keywords: ['facial', 'فيشل', 'نضارة', 'بشرة', 'هيدرا', 'تنظيف'],
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
    alt: 'جلسة هيدرا فيشل ونضارة عميقة للبشرة',
  },
  {
    keywords: ['makeup', 'ميك', 'مكياج', 'سواريه'],
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    alt: 'ميك آب سواريه ولوك ناعم راقي',
  },
  {
    keywords: ['brow', 'حواجب', 'تحديد', 'صبغة'],
    url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80',
    alt: 'رسم وتنظيف وتحديد حواجب وصبغة طبيعية',
  },
  {
    keywords: ['lash', 'رموش'],
    url: 'https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&w=1200&q=80',
    alt: 'تركيب ورفع رموش طبيعية',
  },
  {
    keywords: ['hair', 'شعر', 'استشوار', 'ترميم', 'كافيار', 'بروتين'],
    url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1200&q=80',
    alt: 'ترميم واستشوار ومعالجة شعر بالكافيار',
  },
  {
    keywords: ['bath', 'مغربي', 'حمام'],
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    alt: 'الحمام المغربي الملكي بالأعشاب والصابون الأسود',
  },
  {
    keywords: ['massage', 'مساج', 'استرخاء', 'تدليك'],
    url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=1200&q=80',
    alt: 'جلسة مساج استرخائي بالزيوت العطرية',
  },
  {
    keywords: ['bridal', 'عروس', 'عرايس', 'باكج'],
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    alt: 'باقة العروسة الملكية الشاملة',
  },
  {
    keywords: ['nails', 'أظافر', 'اظافر', 'باديكير', 'مانيكير'],
    url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=80',
    alt: 'جلسة العناية بالأظافر والباديكير والمانيكير',
  },
];

// Generic fallback when no keyword matches.
export const genericServiceImage =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80';

export function imageForService(name: string | null | undefined): {
  url: string;
  alt: string;
} {
  const lower = (name || '').toLowerCase();
  const match = serviceImageMap.find((entry) =>
    entry.keywords.some((k) => lower.includes(k.toLowerCase()))
  );
  if (match) return { url: match.url, alt: match.alt };
  return { url: genericServiceImage, alt: name || 'جلسة تجميل وسبا فاخرة' };
}
