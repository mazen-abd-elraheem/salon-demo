import { formatPrice } from './format';
import type { Booking } from './types';

/**
 * Builds pre-filled WhatsApp URLs (wa.me) in Egyptian Arabic
 */

export function buildDepositApprovalWhatsAppUrl(booking: Booking, spaPhone: string = '01012345678'): string {
  const cleanPhone = booking.customer_phone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('2') ? cleanPhone : '20' + cleanPhone.replace(/^0+/, '');

  const msg = `أهلاً بيكي يا ${booking.customer_name} في ميزون لوميير بيوتي سنتر وسبا 💕
تم تأكيد حجزك بنجاح! 

رقم الحجز: ${booking.booking_number}
التاريخ: ${booking.appointment_date}
الميعاد: ${booking.start_time.slice(0, 5)}
العربون المستلم (٥٠٪): ${formatPrice(booking.deposit_paid, 'ar')}
المتبقي عند الزيارة: ${formatPrice(Number(booking.total_amount) - Number(booking.deposit_paid), 'ar')}

عنوان الصالون: ١٥ شارع البرازيل، الزمالك، القاهرة.
مستنيينك تنورينا! لو حابة تعدلي أي تفاصيل كلمينا على ${spaPhone}.`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
}

export function buildInvoiceLinkWhatsAppUrl(booking: Booking, checkoutUrl: string): string {
  const cleanPhone = booking.customer_phone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('2') ? cleanPhone : '20' + cleanPhone.replace(/^0+/, '');

  const remaining = Math.max(0, Number(booking.total_amount) - Number(booking.deposit_paid));

  const msg = `أهلاً بك يا ${booking.customer_name} 💕
فاتورتك جاهزة في ميزون لوميير بيوتي سنتر:

المبلغ المتبقي: ${formatPrice(remaining, 'ar')}
رابط الفاتورة وسداد الحساب عبر انستا باي أو فودافون كاش أو كاش:
${checkoutUrl}

شكراً لزيارتك ونتمنى تكون جلستك كانت ممتعة ومريحة!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
}

export function buildCompletionWhatsAppUrl(booking: Booking, spaPhone: string = '01012345678'): string {
  const cleanPhone = booking.customer_phone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('2') ? cleanPhone : '20' + cleanPhone.replace(/^0+/, '');

  const msg = `أهلاً بك يا ${booking.customer_name} 💕
تم سداد حسابك بالكامل وإغلاق الفاتورة في ميزون لوميير بيوتي سنتر وسبا.
رقم الحجز: ${booking.booking_number}
إجمالي الخدمات: ${formatPrice(booking.total_amount, 'ar')}

سعدنا جداً بخدمتك ونتمنى أن تكون زيارتك مميزة ومريحة ✨
لأي استفسار أو حجز قادم كلمينا على ${spaPhone}. ننتظرك قريباً!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
}
