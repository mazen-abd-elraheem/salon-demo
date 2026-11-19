import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Cookie, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useRealtimeCatalog } from '../hooks/useRealtimeCatalog';

export function LegalPage({ type }: { type: 'privacy' | 'terms' | 'cookies' }) {
  const { lang } = useLanguage();
  const { settings } = useRealtimeCatalog();

  const handleAcceptAgreement = () => {
    try {
      localStorage.setItem('guzel_data_consent_v1', new Date().toISOString());
      alert(
        lang === 'ar'
          ? 'تم تسجيل موافقتكِ على اتفاقية استخدام البيانات والخصوصية بنجاح.'
          : 'Your agreement to the Data Usage & Privacy Policy has been recorded.',
      );
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col pt-24"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <Navbar settings={settings} />

      <main className="flex-1 container-page py-12 max-w-4xl">
        {/* Top Switcher Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            to="/legal/privacy"
            className={`px-4 py-2 rounded-full text-xs font-semibold no-underline border transition ${
              type === 'privacy'
                ? 'bg-[#cbb6ea] text-[#2c1433] border-[#cbb6ea]'
                : 'bg-white/70 border-[var(--lines)] text-[#3a1d43]'
            }`}
          >
            {lang === 'ar' ? 'سياسة الخصوصية واستخدام البيانات' : 'Privacy & Data Usage Policy'}
          </Link>
          <Link
            to="/legal/terms"
            className={`px-4 py-2 rounded-full text-xs font-semibold no-underline border transition ${
              type === 'terms'
                ? 'bg-[#cbb6ea] text-[#2c1433] border-[#cbb6ea]'
                : 'bg-white/70 border-[var(--lines)] text-[#3a1d43]'
            }`}
          >
            {lang === 'ar' ? 'شروط الخدمة واتفاقية المستخدم' : 'Terms of Service & User Agreement'}
          </Link>
          <Link
            to="/legal/cookies"
            className={`px-4 py-2 rounded-full text-xs font-semibold no-underline border transition ${
              type === 'cookies'
                ? 'bg-[#cbb6ea] text-[#2c1433] border-[#cbb6ea]'
                : 'bg-white/70 border-[var(--lines)] text-[#3a1d43]'
            }`}
          >
            {lang === 'ar' ? 'سياسة ملفات الارتباط (Cookies)' : 'Cookie Policy'}
          </Link>
        </div>

        <div
          className="rounded-[2.25rem] border p-8 sm:p-12 shadow-soft space-y-6"
          style={{
            backgroundColor: 'var(--secondbg, #f3e6f0)',
            borderColor: 'var(--lines, #e8d7e4)',
          }}
        >
          {type === 'privacy' && (
            <>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#cbb6ea] text-[#2c1433] px-3.5 py-1 text-xs font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {lang === 'ar'
                    ? 'حماية البيانات الشخصية واتفاقية الاستخدام'
                    : 'Personal Data Protection & Usage Agreement'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold">
                {lang === 'ar'
                  ? 'سياسة الخصوصية واتفاقية استخدام بيانات العميلات — جوزال ميديكال سبا'
                  : 'Privacy Policy & User Data Usage Agreement — Guzel Medical Spa'}
              </h1>

              {lang === 'ar' ? (
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    يلتزم <strong>جوزال ميديكال سبا للجمال والاسترخاء (Guzel Medical Spa)</strong> بأعلى معايير السرية والأمان في حماية بيانات عميلاته. باستخدامكِ للموقع أو تسجيل حساب أو إتمام حجز، فإنكِ توافقين صراحةً على البنود التالية:
                  </p>
                  <h3 className="text-lg font-bold mt-4">١. البيانات التي نقوم بجمعها بموافقتكِ:</h3>
                  <ul className="list-disc ps-5 space-y-1.5">
                    <li><strong>بيانات الهوية والتواصل:</strong> الاسم، رقم الهاتف المحمول، والبريد الإلكتروني (اختياري) لتأكيد المواعيد وإرسال الفاتورة الرقمية.</li>
                    <li><strong>بيانات الحجز والجلسات:</strong> الخدمات المختارة، الأخصائية المفضلة، وتاريخ ووقت الجلسة لضمان تجهيز الكابينة الخاصة بكِ.</li>
                    <li><strong>إيصالات الدفع والعربون:</strong> صورة إيصال التحويل (إنستاباي أو فودافون كاش) ورقم المرجع لغرض التحقق المالي فقط من قِبل قسم الاستقبال.</li>
                  </ul>
                  <h3 className="text-lg font-bold mt-4">٢. كيف نستخدم بياناتكِ:</h3>
                  <ul className="list-disc ps-5 space-y-1.5">
                    <li>إدارة وتأكيد مواعيدكِ في جوزال ميديكال سبا ومنع تضارب الحجوزات.</li>
                    <li>إصدار فاتورة الـ QR الذكية داخل الفرع ومتابعة سجل جلساتكِ السابقة.</li>
                    <li>لا يتم أبداً بيع أو مشاركة بياناتكِ أو أرقام هواتفكِ مع أي طرف ثالث أو جهات إعلانية خارجية.</li>
                  </ul>
                  <h3 className="text-lg font-bold mt-4">٣. عزل الصلاحيات والأمان التقني:</h3>
                  <p>
                    يطبق النظام فصلاً تاماً في الصلاحيات (Role-Based Access Control) وسياسات أمان صفوف قاعدة البيانات (Supabase RLS)، بحيث لا يمكن لأي زائر أو عميلة الاطلاع على بيانات عميلات أخريات أو الوصول للوحة الإدارة.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    <strong>Guzel Spa for Beauty and Relaxation</strong> is committed to protecting your privacy and personal information. By creating an account or booking an appointment, you explicitly consent to the following data usage terms:
                  </p>
                  <h3 className="text-lg font-bold mt-4">1. Personal Data We Collect With Your Consent:</h3>
                  <ul className="list-disc ps-5 space-y-1.5">
                    <li><strong>Identity &amp; Contact Information:</strong> Full name, mobile number, and optional email address to confirm bookings and send appointment reminders.</li>
                    <li><strong>Appointment &amp; Ritual Preferences:</strong> Selected services, packages, preferred specialists, and scheduled times.</li>
                    <li><strong>Payment Verification Proofs:</strong> Deposit transfer screenshots and reference numbers used strictly by authorized reception staff to verify your reservation.</li>
                  </ul>
                  <h3 className="text-lg font-bold mt-4">2. How Your Data Is Used:</h3>
                  <ul className="list-disc ps-5 space-y-1.5">
                    <li>To schedule and reserve private cabins and specialists at Guzel Spa.</li>
                    <li>To generate your in-branch smart QR invoice and maintain your personal ritual history.</li>
                    <li>We never sell, rent, or share your personal data with third-party marketers.</li>
                  </ul>
                  <h3 className="text-lg font-bold mt-4">3. Security &amp; Access Isolation:</h3>
                  <p>
                    All client records are protected by strict Role-Based Access Control (RBAC) and Row-Level Security (RLS). Client accounts are strictly isolated from administrative and staff interfaces.
                  </p>
                </div>
              )}
            </>
          )}

          {type === 'terms' && (
            <>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#cbb6ea] text-[#2c1433] px-3.5 py-1 text-xs font-bold">
                <FileText className="h-4 w-4" />
                <span>
                  {lang === 'ar' ? 'شروط الحجز واتفاقية المستخدم' : 'Terms of Service & Booking Policy'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold">
                {lang === 'ar'
                  ? 'شروط الخدمة واتفاقية المستخدم — جوزال ميديكال سبا'
                  : 'Terms of Service & User Agreement — Guzel Medical Spa'}
              </h1>

              {lang === 'ar' ? (
                <div className="space-y-4 text-sm leading-relaxed">
                  <h3 className="text-lg font-bold">١. نظام الحجز والعربون (٥٠٪):</h3>
                  <p>
                    لتأكيد جدية الحجز وتجهيز الجناح الخاص والأخصائية، يتطلب النظام سداد عربون بنسبة ٥٠٪ من إجمالي قيمة الجلسات المختارة عبر إنستاباي أو فودافون كاش وإرفاق صورة الإيصال.
                  </p>
                  <h3 className="text-lg font-bold">٢. سياسة التعديل والإلغاء:</h3>
                  <p>
                    يمكن تعديل أو إلغاء الموعد واسترداد العربون بالكامل في حال إبلاغ الاستقبال قبل الموعد بـ ٢٤ ساعة على الأقل. في حال عدم الحضور بدون اعتذار مسبق، يُحتسب العربون مقابل حجز الكابينة.
                  </p>
                  <h3 className="text-lg font-bold">٣. استخدام الموقع والصلاحيات:</h3>
                  <p>
                    الموقع مخصص لحجز جلسات ومنتجات جوزال ميديكال سبا للعميلات. يُحظر أي محاولة للدخول غير المصرح به إلى لوحات الإدارة أو أنظمة الكاشير المخصصة للموظفين فقط.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-relaxed">
                  <h3 className="text-lg font-bold">1. Booking &amp; 50% Deposit Policy:</h3>
                  <p>
                    To guarantee your private cabin and specialist allocation, a 50% deposit is required via InstaPay or Vodafone Cash upon online reservation.
                  </p>
                  <h3 className="text-lg font-bold">2. Rescheduling &amp; Cancellation:</h3>
                  <p>
                    Appointments may be rescheduled or cancelled with a full deposit refund when requested at least 24 hours prior to the scheduled time.
                  </p>
                  <h3 className="text-lg font-bold">3. Authorized Platform Usage:</h3>
                  <p>
                    This platform is provided for Guzel Medical Spa clients to browse and book beauty rituals. Administrative and POS routes are strictly restricted to authenticated salon personnel.
                  </p>
                </div>
              )}
            </>
          )}

          {type === 'cookies' && (
            <>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#cbb6ea] text-[#2c1433] px-3.5 py-1 text-xs font-bold">
                <Cookie className="h-4 w-4" />
                <span>
                  {lang === 'ar' ? 'سياسة ملفات الارتباط والتخزين المحلي' : 'Cookie & Local Storage Policy'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold">
                {lang === 'ar'
                  ? 'سياسة ملفات الارتباط (Cookies) — جوزال ميديكال سبا'
                  : 'Cookie & Storage Policy — Guzel Medical Spa'}
              </h1>

              {lang === 'ar' ? (
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    يستخدم موقع <strong>جوزال ميديكال سبا</strong> تقنيات التخزين المحلي (LocalStorage &amp; SessionStorage) وملفات الارتباط الأساسية فقط من أجل:
                  </p>
                  <ul className="list-disc ps-5 space-y-1.5">
                    <li>حفظ تفضيل اللغة الخاصة بكِ (العربية أو الإنجليزية).</li>
                    <li>حفظ الثيم المفضل لديكِ (البلاش الوردي أو الأبيض النقي).</li>
                    <li>تذكر حالة شاشة التحميل الترحيبية (Preloader Synced) لعدم تأخير تصفحكِ في الزيارات المتكررة.</li>
                    <li>الحفاظ على جلسة تسجيل الدخول الآمنة الخاصة بحسابكِ.</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    <strong>Guzel Spa</strong> uses essential browser storage (`localStorage` and `sessionStorage`) solely to enhance your browsing experience:
                  </p>
                  <ul className="list-disc ps-5 space-y-1.5">
                    <li>Remembering your preferred language (Arabic or English).</li>
                    <li>Saving your chosen visual theme (Blush Pink or Luminous White).</li>
                    <li>Accelerating repeat visits via the `"Synced"` preloader state.</li>
                    <li>Maintaining your authenticated client session securely.</li>
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="pt-6 border-t border-[var(--lines)] flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleAcceptAgreement}
              className="btn-primary text-xs inline-flex items-center gap-2 cursor-pointer border-0"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {lang === 'ar'
                  ? 'أوافق على اتفاقية استخدام البيانات والخصوصية'
                  : 'I Agree to the Data Usage & Privacy Policy'}
              </span>
            </button>

            <Link to="/book" className="text-xs font-semibold text-[#b14bd9] underline">
              {lang === 'ar' ? 'الذهاب لحجز جلسة ←' : 'Proceed to Book a Ritual →'}
            </Link>
          </div>
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}

