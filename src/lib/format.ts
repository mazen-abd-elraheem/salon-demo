export function formatPrice(value: number, lang: 'en' | 'ar' = 'en'): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  if (lang === 'ar') {
    return `${value.toLocaleString('ar-EG')}\u00A0ج.م`;
  }
  return `${value.toLocaleString('en-US')}\u00A0EGP`;
}

export function formatDuration(minutes: number, lang: 'en' | 'ar' = 'en'): string {
  if (!minutes) return '—';
  if (lang === 'ar') {
    if (minutes === 30) return '٣٠ دقيقة';
    if (minutes === 45) return '٤٥ دقيقة';
    if (minutes === 60) return 'ساعة واحدة';
    if (minutes === 75) return 'ساعة وربع';
    if (minutes === 90) return 'ساعة ونصف';
    if (minutes === 120) return 'ساعتين';
    if (minutes < 60) return `${minutes} دقيقة`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} ساعات` : `${h} ساعة و ${m} دقيقة`;
  }
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function initialsFromName(name: string): string {
  if (!name) return '·';
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}
