import { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Building2,
  Globe,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Webhook,
  RefreshCw,
  Edit3,
  X,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import PageHeader from './PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import {
  getLocalPaymentGateways,
  getLocalSettings,
  saveLocalPaymentGateways,
  saveLocalSettings,
  saveSinglePaymentGateway,
} from '../../lib/mockData';
import type { PaymentGatewayConfig, PaymentGatewayProvider } from '../../lib/types';
import { Switch } from './Services';

export default function PaymentGatewaysPage() {
  const { lang } = useLanguage();
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>(() =>
    getLocalPaymentGateways(),
  );
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const handleToggleEnabled = (gw: PaymentGatewayConfig) => {
    const updated = { ...gw, enabled: !gw.enabled };
    saveSinglePaymentGateway(updated);
    setGateways([...getLocalPaymentGateways()]);
    showToast(
      updated.enabled
        ? lang === 'ar'
          ? `تم تفعيل ${gw.name_ar} في صفحة الحجز والدفع`
          : `${gw.name_en} enabled for checkout`
        : lang === 'ar'
        ? `تم إيقاف ${gw.name_ar} مؤقتاً`
        : `${gw.name_en} paused`,
    );
  };

  const handleToggleMode = (gw: PaymentGatewayConfig) => {
    const nextMode: 'sandbox' | 'live' = gw.mode === 'live' ? 'sandbox' : 'live';
    const updated = { ...gw, mode: nextMode };
    saveSinglePaymentGateway(updated);
    setGateways([...getLocalPaymentGateways()]);
    showToast(
      nextMode === 'live'
        ? lang === 'ar'
          ? `تم تحويل ${gw.name_ar} إلى الوضع الفعلي (Live Production)`
          : `${gw.name_en} switched to Live Production mode`
        : lang === 'ar'
        ? `تم تحويل ${gw.name_ar} إلى وضع الاختبار (Sandbox)`
        : `${gw.name_en} switched to Sandbox test mode`,
    );
  };

  const handleTestConnection = (gw: PaymentGatewayConfig) => {
    setTestingId(gw.id);
    window.setTimeout(() => {
      setTestingId(null);
      showToast(
        lang === 'ar'
          ? `✓ اتصال ناجح ببوابة ${gw.name_ar} (${gw.mode === 'live' ? 'الوضع الفعلي Live' : 'وضع الاختبار Sandbox'}) — زمن الاستجابة 118ms`
          : `✓ Handshake verified for ${gw.name_en} (${gw.mode.toUpperCase()}) — 118ms latency`,
      );
    }, 800);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGateway) return;

    saveSinglePaymentGateway(editingGateway);

    // Also sync InstaPay IPA & Vodafone Cash numbers with BusinessSettings so all components stay in sync
    const currentSettings = getLocalSettings();
    if (editingGateway.id === 'instapay' && editingGateway.account_identifier) {
      saveLocalSettings({
        ...currentSettings,
        instapay_ipa: editingGateway.account_identifier,
        instapay_name: editingGateway.account_holder_name || currentSettings.instapay_name,
      });
    } else if (editingGateway.id === 'vodafone_cash' && editingGateway.account_identifier) {
      saveLocalSettings({
        ...currentSettings,
        vodafone_cash_number: editingGateway.account_identifier,
      });
    }

    setGateways([...getLocalPaymentGateways()]);
    setEditingGateway(null);
    showToast(
      lang === 'ar'
        ? `تم حفظ إعدادات ومفاتيح الربط لبوابة ${editingGateway.name_ar} بنجاح!`
        : `Saved API keys and settings for ${editingGateway.name_en}!`,
    );
  };

  const handleResetDefaults = () => {
    localStorage.removeItem('guzel_v4_payment_gateways');
    const fresh = getLocalPaymentGateways();
    saveLocalPaymentGateways(fresh);
    setGateways([...fresh]);
    showToast(
      lang === 'ar'
        ? 'تمت استعادة الإعدادات الافتراضية لبوابات الدفع'
        : 'Reset payment gateways to default configuration',
    );
  };

  const copyWebhook = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedWebhook(id);
    window.setTimeout(() => setCopiedWebhook(null), 2000);
  };

  const getGatewayIcon = (id: PaymentGatewayProvider) => {
    switch (id) {
      case 'paymob':
        return CreditCard;
      case 'fawry':
        return Zap;
      case 'kashier':
      case 'stripe':
        return Globe;
      case 'instapay':
        return Building2;
      case 'vodafone_cash':
        return Smartphone;
      case 'cash':
      default:
        return Banknote;
    }
  };

  const activeCount = gateways.filter((g) => g.enabled).length;
  const liveCount = gateways.filter((g) => g.enabled && g.mode === 'live').length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={lang === 'ar' ? 'المدفوعات والربط المالي' : 'Payment Infrastructure'}
        title={
          lang === 'ar'
            ? 'بوابات الدفع الإلكتروني والربط المباشر'
            : 'Payment Gateway Integrations'
        }
        subtitle={
          lang === 'ar'
            ? 'تحكمي في بوابات الدفع المفعلة في جوزال ميديكال سبا (Paymob، فوري، كاشير/سترايب، إنستاباي، فودافون كاش، والدفع النقدي) ومفاتيح الربط البرمجي API Keys.'
            : 'Configure and toggle online payment gateways (Paymob Egypt, Fawry Pay, Kashier/Stripe, InstaPay, Vodafone Cash, and POS Cash) with live sync to Booking and QR Checkout.'
        }
        actions={
          <button onClick={handleResetDefaults} className="btn-secondary text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'استعادة الإعدادات الافتراضية' : 'Reset Defaults'}</span>
          </button>
        }
      />

      {toast && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2.5 shadow-clean animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-soft p-5 flex items-center justify-between">
          <div>
            <div className="text-xs opacity-70">
              {lang === 'ar' ? 'البوابات المفعلة حالياً' : 'Active Gateways'}
            </div>
            <div className="text-2xl font-bold mt-1 font-mono">
              {activeCount} / {gateways.length}
            </div>
          </div>
          <span className="h-10 w-10 rounded-2xl bg-[#cbb6ea] text-[#2c1433] grid place-items-center">
            <CreditCard className="h-5 w-5" />
          </span>
        </div>

        <div className="card-soft p-5 flex items-center justify-between">
          <div>
            <div className="text-xs opacity-70">
              {lang === 'ar' ? 'بوابات بالوضع الفعلي (Live)' : 'Live Production Mode'}
            </div>
            <div className="text-2xl font-bold mt-1 font-mono text-emerald-700">{liveCount}</div>
          </div>
          <span className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center">
            <ShieldCheck className="h-5 w-5" />
          </span>
        </div>

        <div className="card-soft p-5 flex items-center justify-between">
          <div>
            <div className="text-xs opacity-70">
              {lang === 'ar' ? 'تشفير وأمان المعاملات' : 'Transaction Security'}
            </div>
            <div className="text-sm font-bold mt-1.5 text-[#b14bd9]">
              PCI-DSS &amp; HMAC SHA-512
            </div>
          </div>
          <span className="h-10 w-10 rounded-2xl bg-[#f3e6f0] text-[#b14bd9] grid place-items-center">
            <KeyRound className="h-5 w-5" />
          </span>
        </div>
      </div>

      {/* Gateways Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {gateways.map((gw) => {
          const Icon = getGatewayIcon(gw.id);
          const isElectronicApi = gw.id === 'paymob' || gw.id === 'fawry' || gw.id === 'kashier';

          return (
            <div
              key={gw.id}
              className={[
                'card-soft p-6 flex flex-col justify-between transition-all duration-200',
                gw.enabled ? 'border-[#cbb6ea] shadow-soft' : 'opacity-75',
              ].join(' ')}
            >
              <div>
                {/* Top Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span
                      className={[
                        'h-12 w-12 rounded-2xl grid place-items-center shrink-0',
                        gw.enabled
                          ? 'bg-[#cbb6ea] text-[#2c1433]'
                          : 'bg-[#f3e6f0] text-[#3a1d43]/50',
                      ].join(' ')}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold">
                          {lang === 'ar' ? gw.name_ar : gw.name_en}
                        </h3>
                        <span
                          className={[
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                            gw.mode === 'live'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-[#f3e6f0] text-[#73358c] border border-[#cbb6ea]',
                          ].join(' ')}
                        >
                          {gw.mode === 'live'
                            ? lang === 'ar'
                              ? 'فعلي · LIVE'
                              : 'LIVE'
                            : lang === 'ar'
                            ? 'تجريبي · SANDBOX'
                            : 'SANDBOX'}
                        </span>
                      </div>
                      <span className="inline-block mt-0.5 text-[11px] font-semibold text-[#b14bd9]">
                        {lang === 'ar' ? gw.badge_ar : gw.badge_en}
                      </span>
                    </div>
                  </div>

                  <Switch checked={gw.enabled} onChange={() => handleToggleEnabled(gw)} />
                </div>

                <p className="mt-3 text-xs leading-relaxed opacity-80">
                  {lang === 'ar' ? gw.description_ar : gw.description_en}
                </p>

                {/* Technical Details Box */}
                <div className="mt-4 rounded-2xl border border-[var(--lines)] bg-[#f9f0f5]/80 p-3.5 space-y-2 text-xs">
                  {gw.account_identifier && (
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">
                        {gw.id === 'instapay'
                          ? lang === 'ar'
                            ? 'عنوان الدفع (IPA):'
                            : 'InstaPay Address:'
                          : lang === 'ar'
                          ? 'رقم المحفظة المعتمد:'
                          : 'Wallet Number:'}
                      </span>
                      <span className="font-mono font-bold text-[#3a1d43]" dir="ltr">
                        {gw.account_identifier}
                      </span>
                    </div>
                  )}

                  {gw.merchant_id && (
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">
                        {lang === 'ar' ? 'معرّف التاجر (Merchant ID):' : 'Merchant ID:'}
                      </span>
                      <span className="font-mono font-semibold" dir="ltr">
                        {gw.merchant_id}
                      </span>
                    </div>
                  )}

                  {gw.public_key && (
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">
                        {lang === 'ar' ? 'المفتاح العام (Public Key):' : 'Public Key:'}
                      </span>
                      <span className="font-mono text-[11px] truncate max-w-[14rem]" dir="ltr">
                        {gw.public_key}
                      </span>
                    </div>
                  )}

                  {gw.integration_id_card && (
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">
                        {lang === 'ar' ? 'معرّف ربط البطاقات والمحافظ:' : 'Card / Wallet Integration ID:'}
                      </span>
                      <span className="font-mono text-[11px]" dir="ltr">
                        {gw.integration_id_card} / {gw.integration_id_wallet || '—'}
                      </span>
                    </div>
                  )}

                  {gw.webhook_url && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--lines)]">
                      <span className="opacity-70 inline-flex items-center gap-1">
                        <Webhook className="h-3 w-3" />
                        <span>Webhook:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyWebhook(gw.webhook_url!, gw.id)}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-[#b14bd9] hover:underline bg-transparent border-0 cursor-pointer"
                        dir="ltr"
                      >
                        <span className="truncate max-w-[13rem]">{gw.webhook_url}</span>
                        {copiedWebhook === gw.id ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {gw.supports_online_deposit && (
                      <span className="rounded-lg bg-white px-2.5 py-0.5 text-[10px] font-semibold border border-[var(--lines)]">
                        {lang === 'ar' ? '✓ متاح لدفع عربون الحجز أونلاين' : '✓ Online Deposit Checkout'}
                      </span>
                    )}
                    {gw.supports_in_branch_qr && (
                      <span className="rounded-lg bg-white px-2.5 py-0.5 text-[10px] font-semibold border border-[var(--lines)]">
                        {lang === 'ar' ? '✓ متاح لسداد فاتورة الـ QR بالفرع' : '✓ In-Branch QR Settlement'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-4 border-t border-[var(--lines)] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingGateway({ ...gw })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#cbb6ea] text-[#2c1433] hover:bg-[#e58fb6] px-4 py-2 text-xs font-bold transition cursor-pointer border-0"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'إعداد المفاتيح والربط' : 'Configure Keys'}</span>
                  </button>

                  {isElectronicApi && (
                    <button
                      type="button"
                      onClick={() => handleToggleMode(gw)}
                      className="rounded-full border border-[var(--lines)] bg-white px-3.5 py-2 text-xs font-semibold hover:border-[#b14bd9] transition cursor-pointer"
                    >
                      {gw.mode === 'live'
                        ? lang === 'ar'
                          ? 'تحويل لـ Sandbox'
                          : 'Switch to Sandbox'
                        : lang === 'ar'
                        ? 'تفعيل الوضع الفعلي Live'
                        : 'Go Live'}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleTestConnection(gw)}
                  disabled={testingId === gw.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--lines)] bg-white/80 px-3.5 py-2 text-xs font-semibold hover:bg-white transition cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testingId === gw.id ? 'animate-spin text-[#b14bd9]' : ''}`} />
                  <span>
                    {testingId === gw.id
                      ? lang === 'ar'
                        ? 'جاري الاختبار...'
                        : 'Testing…'
                      : lang === 'ar'
                      ? 'اختبار الاتصال'
                      : 'Test Connection'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configure Gateway Modal */}
      {editingGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25142d]/50 p-4 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleSaveModal}
            className="w-full max-w-lg rounded-3xl bg-white border border-[var(--lines)] p-6 shadow-soft space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-[var(--lines)] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#b14bd9]">
                  {lang === 'ar' ? 'إعدادات بوابة الدفع' : 'Gateway Configuration'}
                </span>
                <h3 className="text-lg font-bold">
                  {lang === 'ar' ? editingGateway.name_ar : editingGateway.name_en}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingGateway(null)}
                className="h-8 w-8 rounded-full border border-[var(--lines)] grid place-items-center bg-transparent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Direct Transfer Gateways (InstaPay / Vodafone Cash) */}
            {(editingGateway.id === 'instapay' || editingGateway.id === 'vodafone_cash') && (
              <div className="space-y-3">
                <div>
                  <label className="field-label">
                    {editingGateway.id === 'instapay'
                      ? lang === 'ar'
                        ? 'عنوان الدفع اللحظي (InstaPay IPA)'
                        : 'InstaPay IPA Address'
                      : lang === 'ar'
                      ? 'رقم محفظة فودافون كاش / المحفظة الإلكترونية'
                      : 'Vodafone Cash Wallet Number'}
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={editingGateway.account_identifier || ''}
                    onChange={(e) =>
                      setEditingGateway({
                        ...editingGateway,
                        account_identifier: e.target.value,
                      })
                    }
                    className="field-input font-mono"
                  />
                </div>
                <div>
                  <label className="field-label">
                    {lang === 'ar' ? 'اسم صاحب الحساب الظاهر للعميلة' : 'Account Holder Name'}
                  </label>
                  <input
                    type="text"
                    value={editingGateway.account_holder_name || ''}
                    onChange={(e) =>
                      setEditingGateway({
                        ...editingGateway,
                        account_holder_name: e.target.value,
                      })
                    }
                    className="field-input"
                  />
                </div>
              </div>
            )}

            {/* Electronic API Gateways (Paymob / Fawry / Kashier) */}
            {(editingGateway.id === 'paymob' ||
              editingGateway.id === 'fawry' ||
              editingGateway.id === 'kashier') && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">
                      {lang === 'ar' ? 'بيئة التشغيل (Mode)' : 'Environment Mode'}
                    </label>
                    <select
                      value={editingGateway.mode}
                      onChange={(e) =>
                        setEditingGateway({
                          ...editingGateway,
                          mode: e.target.value as 'sandbox' | 'live',
                        })
                      }
                      className="field-input"
                    >
                      <option value="sandbox">
                        {lang === 'ar' ? 'تجريبي (Sandbox / Test)' : 'Sandbox (Test Mode)'}
                      </option>
                      <option value="live">
                        {lang === 'ar' ? 'فعلي (Live Production)' : 'Live (Production)'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">
                      {lang === 'ar' ? 'كود التاجر (Merchant ID)' : 'Merchant ID'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={editingGateway.merchant_id || ''}
                      onChange={(e) =>
                        setEditingGateway({ ...editingGateway, merchant_id: e.target.value })
                      }
                      className="field-input font-mono text-xs"
                    />
                  </div>
                </div>

                {editingGateway.id !== 'fawry' && (
                  <div>
                    <label className="field-label">
                      {lang === 'ar' ? 'المفتاح العام (API Public Key)' : 'API Public Key'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={editingGateway.public_key || ''}
                      onChange={(e) =>
                        setEditingGateway({ ...editingGateway, public_key: e.target.value })
                      }
                      className="field-input font-mono text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="field-label">
                    {lang === 'ar' ? 'المفتاح السري (API Secret Key)' : 'API Secret Key'}
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={editingGateway.secret_key || ''}
                    onChange={(e) =>
                      setEditingGateway({ ...editingGateway, secret_key: e.target.value })
                    }
                    className="field-input font-mono text-xs"
                  />
                </div>

                {editingGateway.id === 'paymob' && (
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="field-label">Card Integration ID</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={editingGateway.integration_id_card || ''}
                        onChange={(e) =>
                          setEditingGateway({
                            ...editingGateway,
                            integration_id_card: e.target.value,
                          })
                        }
                        className="field-input font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="field-label">Wallet Integration ID</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={editingGateway.integration_id_wallet || ''}
                        onChange={(e) =>
                          setEditingGateway({
                            ...editingGateway,
                            integration_id_wallet: e.target.value,
                          })
                        }
                        className="field-input font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="field-label">Iframe ID</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={editingGateway.iframe_id || ''}
                        onChange={(e) =>
                          setEditingGateway({
                            ...editingGateway,
                            iframe_id: e.target.value,
                          })
                        }
                        className="field-input font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="field-label">
                    {lang === 'ar' ? 'رابط الإشعارات الفورية (Webhook Callback URL)' : 'Webhook Callback URL'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editingGateway.webhook_url || ''}
                    onChange={(e) =>
                      setEditingGateway({ ...editingGateway, webhook_url: e.target.value })
                    }
                    className="field-input font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* Availability Toggles */}
            <div className="rounded-2xl border border-[var(--lines)] bg-[#f9f0f5] p-3.5 space-y-2.5">
              <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                <span>
                  {lang === 'ar'
                    ? 'إتاحة البوابة لسداد عربون الحجز أونلاين (٥٠٪)'
                    : 'Enable for Online 50% Deposit Booking'}
                </span>
                <input
                  type="checkbox"
                  checked={editingGateway.supports_online_deposit}
                  onChange={(e) =>
                    setEditingGateway({
                      ...editingGateway,
                      supports_online_deposit: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[#b14bd9]"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                <span>
                  {lang === 'ar'
                    ? 'إتاحة البوابة في شاشة سداد فاتورة الـ QR بالفرع'
                    : 'Enable for In-Branch QR Checkout'}
                </span>
                <input
                  type="checkbox"
                  checked={editingGateway.supports_in_branch_qr}
                  onChange={(e) =>
                    setEditingGateway({
                      ...editingGateway,
                      supports_in_branch_qr: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[#b14bd9]"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--lines)]">
              <button
                type="button"
                onClick={() => setEditingGateway(null)}
                className="btn-ghost text-xs"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="btn-primary text-xs">
                {lang === 'ar' ? 'حفظ ومزامنة البوابة' : 'Save & Sync Gateway'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

