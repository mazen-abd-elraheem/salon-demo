import type {
  BlockedDate,
  Booking,
  BusinessHour,
  BusinessSettings,
  Package,
  Product,
  PromoCode,
  Room,
  Service,
  Shift,
  Specialist,
  TabAddon,
  Payment,
  StaffUser,
  CustomerUser,
  AttendanceRecord,
  AttendanceStatus,
  ShiftType,
} from './types';

export const defaultRooms: Room[] = [
  {
    id: 'room-1',
    name_ar: 'جناح الحمام المغربي الملكي',
    name_en: 'Royal Moroccan Bath Suite',
    type: 'moroccan_bath',
    capacity: 1,
    is_active: true,
  },
  {
    id: 'room-2',
    name_ar: 'كابينة المساج والاسترخاء (أ)',
    name_en: 'Massage Cabin A',
    type: 'massage_room',
    capacity: 1,
    is_active: true,
  },
  {
    id: 'room-3',
    name_ar: 'كابينة تنظيف ونضارة البشرة (١)',
    name_en: 'Facial Cabin 1',
    type: 'facial_cabin',
    capacity: 1,
    is_active: true,
  },
  {
    id: 'room-4',
    name_ar: 'محطة تصفيف وترميم الشعر (١)',
    name_en: 'Hair Station 1',
    type: 'hair_station',
    capacity: 1,
    is_active: true,
  },
  {
    id: 'room-5',
    name_ar: 'استوديو الميك آب والعرائس',
    name_en: 'Bridal & Makeup Suite',
    type: 'general',
    capacity: 2,
    is_active: true,
  },
  {
    id: 'room-6',
    name_ar: 'محطة العناية بالأظافر والباديكير',
    name_en: 'Nail Bar Station',
    type: 'nails_station',
    capacity: 2,
    is_active: true,
  },
];

export const defaultSpecialists: Specialist[] = [
  {
    id: 'spec-1',
    name_ar: 'نورهان فهمي',
    name_en: 'Nourhan Fahmy',
    title_ar: 'خبيرة العناية بالبشرة والهيدرا فيشل',
    title_en: 'Senior Skincare Specialist',
    specialties: ['skincare', 'bridal'],
    is_active: true,
  },
  {
    id: 'spec-2',
    name_ar: 'سارة المنشاوي',
    name_en: 'Sara El-Menshawy',
    title_ar: 'أخصائية مساج علاجي واسترخاء',
    title_en: 'Therapeutic Massage Specialist',
    specialties: ['massage', 'moroccan_bath'],
    is_active: true,
  },
  {
    id: 'spec-3',
    name_ar: 'أمينة رشيد',
    name_en: 'Amina Rachid',
    title_ar: 'خبيرة الحمام المغربي والملكي',
    title_en: 'Moroccan Bath Master',
    specialties: ['moroccan_bath', 'skincare'],
    is_active: true,
  },
  {
    id: 'spec-4',
    name_ar: 'ياسمين شريف',
    name_en: 'Yasmine Sherif',
    title_ar: 'ميك آب أرتيست ومصممة لوكات',
    title_en: 'Senior Makeup Artist',
    specialties: ['bridal', 'skincare'],
    is_active: true,
  },
  {
    id: 'spec-5',
    name_ar: 'هبة كمال',
    name_en: 'Heba Kamal',
    title_ar: 'أخصائية معالجات وترميم الشعر',
    title_en: 'Hair Revival & Styling Master',
    specialties: ['hair', 'bridal'],
    is_active: true,
  },
  {
    id: 'spec-6',
    name_ar: 'مريم طارق',
    name_en: 'Mariam Tarek',
    title_ar: 'أخصائية حواجب ورموش وأظافر',
    title_en: 'Lash & Brow Specialist',
    specialties: ['nails', 'skincare'],
    is_active: true,
  },
];

export const defaultServices: Service[] = [
  {
    id: 'svc-1',
    name: 'Signature Hydrafacial Ritual',
    name_ar: 'جلسة هيدرا فيشل ونضارة عميقة',
    name_en: 'Signature Hydrafacial Ritual',
    category: 'skincare',
    description:
      'A deep pore cleanse, customized botanical peel, lymphatic drainage, and intense hyaluronic infusion for luminous, rested skin.',
    description_ar:
      'تنضيف عميق للمسام وتقشير لطيف بأحماض الفواكه مع مساج ليمفاوي وسيروم هيالورونيك لنضارة وإشراقة فورية.',
    description_en:
      'Deep pore cleanse, botanical peel, lymphatic drainage, and intense hyaluronic infusion.',
    duration_minutes: 60,
    price: 1500,
    room_type_required: 'facial_cabin',
    is_active: true,
  },
  {
    id: 'svc-2',
    name: 'Royal Moroccan Bath Ritual',
    name_ar: 'الحمام المغربي الملكي بالأعشاب والصابون الأسود',
    name_en: 'Royal Moroccan Bath Ritual',
    category: 'moroccan_bath',
    description:
      'Authentic steam bath, traditional black soap exfoliation, rose clay mask, and total body relaxation.',
    description_ar:
      'طقس مغربي أصيل: بخار، تلييف بالصابون البلدي، ماسك الطمي الطبيعي مع الورد، وتفتيح وتنعيم فوري للجسم.',
    description_en:
      'Authentic steam bath, black soap exfoliation, rose clay mask, and total body softening.',
    duration_minutes: 90,
    price: 2200,
    room_type_required: 'moroccan_bath',
    is_active: true,
  },
  {
    id: 'svc-3',
    name: 'Aromatherapy Relaxation Massage',
    name_ar: 'جلسة مساج استرخائي بالزيوت العطرية',
    name_en: 'Aromatherapy Relaxation Massage',
    category: 'massage',
    description:
      'Full body 60-min therapeutic massage with organic aromatic oils to relieve muscle stiffness and stress.',
    description_ar:
      'مساج كامل للجسم لمدة ٦٠ دقيقة لفك التشنجات العضلية وتهدئة الأعصاب باستخدام أرقى الزيوت العطرية الطبيعية.',
    description_en:
      'Full body 60-min therapeutic massage with aromatic oils to soothe mind and body.',
    duration_minutes: 60,
    price: 1200,
    room_type_required: 'massage_room',
    is_active: true,
  },
  {
    id: 'svc-4',
    name: 'Soft Glam Makeup & Glow',
    name_ar: 'ميك آب سواريه ولوك ناعم',
    name_en: 'Soft Glam Makeup & Glow',
    category: 'bridal',
    description:
      'Skin-first, radiant makeup tailored to your features and evening event. Includes premium prep and lashes.',
    description_ar:
      'ميك آب هادي وراقي يبرز جمالك وملامحك الطبيعية مع تجهيز كامل للبشرة وتركيب رموش حبة حبة للمناسبات.',
    description_en:
      'Skin-first radiant makeup tailored to your features with luxury skin prep and delicate lashes.',
    duration_minutes: 75,
    price: 1800,
    room_type_required: 'general',
    is_active: true,
  },
  {
    id: 'svc-5',
    name: 'Caviar Hair Revival & Signature Blowout',
    name_ar: 'ترميم واستشوار ومعالجة شعر بالكافيار',
    name_en: 'Caviar Hair Revival & Signature Blowout',
    category: 'hair',
    description:
      'Deep scalp detoxification, caviar hair mask therapy, and a voluminous, bouncy signature blowout.',
    description_ar:
      'ديتوكس لفروة الرأس مع جلسة ماسك كافيار لترميم الشعر وتصفيف بالسيشوار فوليوم يجنن يدوم أيام.',
    description_en:
      'Deep scalp detox, caviar repair mask therapy, and a voluminous signature blowout.',
    duration_minutes: 60,
    price: 1100,
    room_type_required: 'hair_station',
    is_active: true,
  },
  {
    id: 'svc-6',
    name: 'Atelier Brow Shaping & Tint',
    name_ar: 'رسم وتنظيف وتحديد حواجب وصبغة طبيعية',
    name_en: 'Atelier Brow Shaping & Tint',
    category: 'nails',
    description:
      'Architectural brow mapping, custom tinting, precision tweezing, and a nourishing keratin finishing balm.',
    description_ar:
      'رسم هندسي وتحديد دقيق لشكل الحواجب مع صبغة مخصصة وماسك كيراتين مغذي يعيد كثافتها.',
    description_en:
      'Architectural brow mapping, custom tinting, precision tweezing, and keratin balm.',
    duration_minutes: 45,
    price: 600,
    room_type_required: 'nails_station',
    is_active: true,
  },
  {
    id: 'svc-7',
    name: 'Lash Lift & Keratin Glaze',
    name_ar: 'رفع وتغذية رموش لاش ليفت (Lash Lift)',
    name_en: 'Lash Lift & Keratin Glaze',
    category: 'nails',
    description:
      'Natural lash lift curl and deep obsidian tinting with organic peptide glaze for up to 8 weeks.',
    description_ar:
      'ثني ورفع الرموش الطبيعية بلون أسود جذاب مع سيروم ببتيدات وزيوت طبيعية تدوم لغاية ٨ أسابيع.',
    description_en:
      'Natural lash lift curl and deep obsidian tinting with peptide glaze for up to 8 weeks.',
    duration_minutes: 60,
    price: 900,
    room_type_required: 'facial_cabin',
    is_active: true,
  },
];

export const defaultPackages: Package[] = [
  {
    id: 'pkg-1',
    name_ar: 'باقة العروسة الملكية الشاملة (Royal Bridal Package)',
    name_en: 'Royal Bridal Signature Package',
    description_ar:
      'الباقة المتكاملة لليلة العمر: حمام مغربي ملكي + هيدرا فيشل نضارة + ترميم واستشوار الشعر + ميك آب عروسة متكامل.',
    description_en:
      'Complete bridal journey: Royal Moroccan bath, Hydrafacial, hair therapy, and luxury bridal makeup.',
    price: 6500,
    duration_minutes: 240,
    is_active: true,
  },
  {
    id: 'pkg-2',
    name_ar: 'باقة الروقان والاسترخاء التام (Total Spa Day)',
    name_en: 'Total Glow & Relaxation Spa Day',
    description_ar:
      'يوم دلع كامل: حمام مغربي بالأعشاب + مساج استرخائي ٦٠ دقيقة + تنظيف ونضارة بشرة.',
    description_en:
      'Full Moroccan bath, 60-min aromatic massage, and restorative facial treatment.',
    price: 4200,
    duration_minutes: 180,
    is_active: true,
  },
];

export const defaultProducts: Product[] = [
  {
    id: 'prod-1',
    name_ar: 'سيروم الهيالورونيك اسيد المكثف (30ml)',
    name_en: 'Intensive Hyaluronic Serum',
    category: 'skincare',
    price: 650,
    stock_quantity: 25,
    sku: 'SKIN-HYA-01',
    is_active: true,
  },
  {
    id: 'prod-2',
    name_ar: 'ماسك الكافيار لترميم الشعر (250g)',
    name_en: 'Caviar Hair Repair Mask',
    category: 'hair',
    price: 850,
    stock_quantity: 18,
    sku: 'HAIR-CAV-02',
    is_active: true,
  },
  {
    id: 'prod-3',
    name_ar: 'صابون بلدي مغربي أصلي بزيت الزيتون (300g)',
    name_en: 'Authentic Moroccan Black Soap',
    category: 'moroccan_bath',
    price: 350,
    stock_quantity: 40,
    sku: 'SPA-SOAP-03',
    is_active: true,
  },
  {
    id: 'prod-4',
    name_ar: 'زيت الأرجان النقي المعصور على البارد (100ml)',
    name_en: 'Cold-Pressed Pure Argan Oil',
    category: 'skincare',
    price: 750,
    stock_quantity: 20,
    sku: 'OIL-ARG-04',
    is_active: true,
  },
  {
    id: 'prod-5',
    name_ar: 'سيروم تكثيف وتطويل الرموش والحواجب (10ml)',
    name_en: 'Peptide Lash & Brow Growth Elixir',
    category: 'nails',
    price: 450,
    stock_quantity: 30,
    sku: 'LASH-ELX-05',
    is_active: true,
  },
];

export const defaultPromoCodes: PromoCode[] = [
  {
    id: 'promo-1',
    code: 'WELCOME10',
    discount_type: 'percent',
    discount_value: 10,
    min_spend: 1000,
    max_uses: 200,
    times_used: 12,
    is_active: true,
  },
  {
    id: 'promo-2',
    code: 'MAISON200',
    discount_type: 'fixed',
    discount_value: 200,
    min_spend: 2000,
    max_uses: 100,
    times_used: 8,
    is_active: true,
  },
];

export const defaultShifts: Shift[] = [
  {
    id: 'shift-1',
    name_ar: 'وردية صباحية',
    name_en: 'Morning Shift',
    start_time: '10:00:00',
    end_time: '16:00:00',
    is_active: true,
  },
  {
    id: 'shift-2',
    name_ar: 'وردية مسائية',
    name_en: 'Evening Shift',
    start_time: '16:00:00',
    end_time: '23:00:00',
    is_active: true,
  },
];

export const defaultBusinessHours: BusinessHour[] = [
  { id: 'bh-0', weekday: 0, is_open: true, start_time: '11:00:00', end_time: '21:00:00' },
  { id: 'bh-1', weekday: 1, is_open: true, start_time: '10:00:00', end_time: '21:00:00' },
  { id: 'bh-2', weekday: 2, is_open: true, start_time: '10:00:00', end_time: '21:00:00' },
  { id: 'bh-3', weekday: 3, is_open: true, start_time: '10:00:00', end_time: '21:00:00' },
  { id: 'bh-4', weekday: 4, is_open: true, start_time: '10:00:00', end_time: '22:00:00' },
  { id: 'bh-5', weekday: 5, is_open: true, start_time: '13:00:00', end_time: '22:00:00' },
  { id: 'bh-6', weekday: 6, is_open: true, start_time: '10:00:00', end_time: '21:00:00' },
];

export const defaultBlockedDates: BlockedDate[] = [];

export const defaultSettings: BusinessSettings = {
  id: 'bs-default',
  business_name: 'ميزون لوميير بيوتي سنتر وسبا',
  business_name_en: 'Maison Lumière Beauty Center & Spa',
  business_email: 'contact@maisonlumiere.beauty',
  business_phone: '01012345678',
  business_address: '١٥ شارع البرازيل، الزمالك، القاهرة',
  instapay_ipa: 'maisonlumiere@instapay',
  instapay_name: 'Maison Lumière Spa',
  vodafone_cash_number: '01012345678',
  deposit_percentage: 50,
  deposit_hold_minutes: 30,
  slot_interval_minutes: 30,
  booking_notice_hours: 2,
  cancellation_notice_hours: 24,
};

// ============================================================================
// Local Storage Simulation for Offline / Demo Testing
// ============================================================================

export const initialSeedBookings: Booking[] = [
  {
    id: 'bkg-demo-1',
    booking_number: 'BK-2026-1042',
    secret_token: 'tok-sarah-1042',
    customer_name: 'سارة محمود',
    customer_phone: '01098765432',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '14:00:00',
    end_time: '16:00:00',
    subtotal_amount: 2200,
    discount_amount: 0,
    total_amount: 2950,
    deposit_required: 1100,
    deposit_paid: 1100,
    status: 'checked_in',
    notes: 'تفضل غرفة الحمام المغربي الملكي هادئة ومجهزة بالأعشاب الطبيعية',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    items: [
      {
        id: 'item-1',
        booking_id: 'bkg-demo-1',
        service_id: 'svc-2',
        service: defaultServices[1],
        scheduled_start: '14:00:00',
        scheduled_end: '15:30:00',
        price: 2200,
        specialist_id: 'spec-3',
        specialist: defaultSpecialists[2],
        room_id: 'room-3',
        room: defaultRooms[2],
      },
    ],
    addons: [
      {
        id: 'addon-1',
        booking_id: 'bkg-demo-1',
        type: 'product',
        item_id: 'prod-4',
        name_ar: 'زيت الأرجان النقي المعصور على البارد (100ml)',
        name_en: 'Cold-Pressed Pure Argan Oil',
        quantity: 1,
        price: 750,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    payments: [
      {
        id: 'pay-1',
        booking_id: 'bkg-demo-1',
        payment_type: 'deposit',
        method: 'instapay',
        amount: 1100,
        reference_number: 'IP-8823190',
        status: 'verified',
        verified_by_staff_name: 'رنا نبيل',
        verified_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        shift_name: 'وردية صباحية',
        shift_id: 'shift-1',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
  },
  {
    id: 'bkg-demo-2',
    booking_number: 'BK-2026-1088',
    secret_token: 'tok-nouran-1088',
    customer_name: 'نوران الشريف',
    customer_phone: '01123456789',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '16:30:00',
    end_time: '17:45:00',
    subtotal_amount: 1500,
    discount_amount: 0,
    total_amount: 1500,
    deposit_required: 750,
    deposit_paid: 0,
    status: 'pending_verification',
    notes: 'تحويل عبر انستا باي بمبلغ ٧٥٠ ج.م، بانتظار اعتماد الموظفة',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    items: [
      {
        id: 'item-2',
        booking_id: 'bkg-demo-2',
        service_id: 'svc-1',
        service: defaultServices[0],
        scheduled_start: '16:30:00',
        scheduled_end: '17:45:00',
        price: 1500,
        specialist_id: 'spec-2',
        specialist: defaultSpecialists[1],
        room_id: 'room-4',
        room: defaultRooms[3],
      },
    ],
    payments: [
      {
        id: 'pay-2',
        booking_id: 'bkg-demo-2',
        payment_type: 'deposit',
        method: 'instapay',
        amount: 750,
        reference_number: 'IP-9912044',
        proof_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60',
        status: 'pending',
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  },
  {
    id: 'bkg-demo-3',
    booking_number: 'BK-2026-1105',
    secret_token: 'tok-maryam-1105',
    customer_name: 'مريم عادل',
    customer_phone: '01234567890',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '18:00:00',
    end_time: '19:00:00',
    subtotal_amount: 1200,
    discount_amount: 0,
    total_amount: 1200,
    deposit_required: 600,
    deposit_paid: 600,
    status: 'confirmed',
    notes: 'عربون فودافون كاش مؤكد، جاهزة لتسجيل الدخول عند الوصول',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    items: [
      {
        id: 'item-3',
        booking_id: 'bkg-demo-3',
        service_id: 'svc-3',
        service: defaultServices[2],
        scheduled_start: '18:00:00',
        scheduled_end: '19:00:00',
        price: 1200,
        specialist_id: 'spec-3',
        specialist: defaultSpecialists[2],
        room_id: 'room-2',
        room: defaultRooms[1],
      },
    ],
    payments: [
      {
        id: 'pay-3',
        booking_id: 'bkg-demo-3',
        payment_type: 'deposit',
        method: 'vodafone_cash',
        amount: 600,
        reference_number: '01234567890',
        status: 'verified',
        verified_by_staff_name: 'رنا نبيل',
        verified_at: new Date(Date.now() - 5400000).toISOString(),
        shift_name: 'وردية مسائية',
        shift_id: 'shift-2',
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
  },
  {
    id: 'bkg-demo-4',
    booking_number: 'BK-2026-0975',
    secret_token: 'tok-yasmine-0975',
    customer_name: 'ياسمين كمال',
    customer_phone: '01555554321',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '13:00:00',
    end_time: '15:00:00',
    subtotal_amount: 2000,
    discount_amount: 0,
    total_amount: 2000,
    deposit_required: 1000,
    deposit_paid: 1000,
    status: 'checkout_pending',
    notes: 'أنهت الجلسات وقامت برفع إيصال سداد المبلغ المتبقي (١٠٠٠ ج.م)',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    items: [
      {
        id: 'item-4',
        booking_id: 'bkg-demo-4',
        service_id: 'svc-5',
        service: defaultServices[4],
        scheduled_start: '13:00:00',
        scheduled_end: '14:00:00',
        price: 1100,
      },
      {
        id: 'item-5',
        booking_id: 'bkg-demo-4',
        service_id: 'svc-7',
        service: defaultServices[6],
        scheduled_start: '14:00:00',
        scheduled_end: '15:00:00',
        price: 900,
      },
    ],
    payments: [
      {
        id: 'pay-4-dep',
        booking_id: 'bkg-demo-4',
        payment_type: 'deposit',
        method: 'vodafone_cash',
        amount: 1000,
        reference_number: '01555554321',
        status: 'verified',
        verified_by_staff_name: 'سارة فرج',
        verified_at: new Date(Date.now() - 12000000).toISOString(),
        shift_name: 'وردية صباحية',
        shift_id: 'shift-1',
        created_at: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: 'pay-4-set',
        booking_id: 'bkg-demo-4',
        payment_type: 'settlement',
        method: 'vodafone_cash',
        amount: 1000,
        reference_number: '01555554321',
        proof_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60',
        status: 'pending',
        created_at: new Date(Date.now() - 600000).toISOString(),
      },
    ],
  },
  {
    id: 'bkg-demo-5',
    booking_number: 'BK-2026-0920',
    secret_token: 'tok-dina-0920',
    customer_name: 'دينا فاروق',
    customer_phone: '01011122233',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '11:00:00',
    end_time: '12:30:00',
    subtotal_amount: 1800,
    discount_amount: 0,
    total_amount: 1800,
    deposit_required: 900,
    deposit_paid: 900,
    status: 'completed',
    notes: 'تمت الجلسة بنجاح واستلام المبلغ المتبقي نقداً بالدرج',
    created_at: new Date(Date.now() - 25000000).toISOString(),
    payments: [
      {
        id: 'pay-5-dep',
        booking_id: 'bkg-demo-5',
        payment_type: 'deposit',
        method: 'instapay',
        amount: 900,
        reference_number: 'IP-5544129',
        status: 'verified',
        verified_by_staff_name: 'رنا نبيل',
        shift_name: 'وردية صباحية',
        shift_id: 'shift-1',
        created_at: new Date(Date.now() - 25000000).toISOString(),
      },
      {
        id: 'pay-5-set',
        booking_id: 'bkg-demo-5',
        payment_type: 'settlement',
        method: 'cash',
        amount: 900,
        status: 'verified',
        verified_by_staff_name: 'رنا نبيل',
        shift_name: 'وردية صباحية',
        shift_id: 'shift-1',
        created_at: new Date(Date.now() - 20000000).toISOString(),
      },
    ],
  },
];

export function getLocalBookings(): Booking[] {
  try {
    const raw = localStorage.getItem('maison_v2_bookings');
    if (raw) return JSON.parse(raw);
    // Initialize with seed data on first load
    localStorage.setItem('maison_v2_bookings', JSON.stringify(initialSeedBookings));
    return initialSeedBookings;
  } catch {
    return initialSeedBookings;
  }
}

export function saveLocalBooking(booking: Booking) {
  try {
    const bookings = getLocalBookings();
    const existingIndex = bookings.findIndex((b) => b.id === booking.id);
    if (existingIndex >= 0) {
      bookings[existingIndex] = booking;
    } else {
      bookings.unshift(booking);
    }
    localStorage.setItem('maison_v2_bookings', JSON.stringify(bookings));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to save booking to localStorage', err);
  }
}

export function getLocalBookingByToken(token: string): Booking | null {
  const bookings = getLocalBookings();
  return bookings.find((b) => b.secret_token === token || b.id === token) || null;
}

export function getLocalBookingByPhone(phone: string, bookingNumber?: string): Booking | null {
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const bookings = getLocalBookings();
  return (
    bookings.find(
      (b) =>
        b.customer_phone.replace(/\s+/g, '') === cleanPhone &&
        (!bookingNumber || b.booking_number.toUpperCase() === bookingNumber.trim().toUpperCase()),
    ) || null
  );
}

export function addTabAddonToLocal(bookingId: string, addon: TabAddon) {
  const bookings = getLocalBookings();
  const b = bookings.find((item) => item.id === bookingId);
  if (b) {
    b.addons = b.addons || [];
    b.addons.push(addon);
    b.total_amount = Number(b.total_amount) + Number(addon.price) * (addon.quantity || 1);
    saveLocalBooking(b);
  }
}

export function removeTabAddonFromLocal(bookingId: string, addonId: string) {
  const bookings = getLocalBookings();
  const b = bookings.find((item) => item.id === bookingId);
  if (b && b.addons) {
    const item = b.addons.find((a) => a.id === addonId);
    if (item) {
      b.total_amount = Math.max(0, Number(b.total_amount) - Number(item.price) * (item.quantity || 1));
      b.addons = b.addons.filter((a) => a.id !== addonId);
      saveLocalBooking(b);
    }
  }
}

export function updateLocalBookingStatus(bookingId: string, status: Booking['status']) {
  const bookings = getLocalBookings();
  const b = bookings.find((item) => item.id === bookingId);
  if (b) {
    b.status = status;
    saveLocalBooking(b);
  }
}

export function addPaymentToLocal(bookingId: string, payment: Payment) {
  const bookings = getLocalBookings();
  const b = bookings.find((item) => item.id === bookingId);
  if (b) {
    b.payments = b.payments || [];
    b.payments.push(payment);
    if (payment.payment_type === 'deposit' && payment.status === 'verified') {
      b.deposit_paid = Number(b.deposit_paid || 0) + Number(payment.amount);
    }
    saveLocalBooking(b);
  }
}

export const defaultStaffUsers: StaffUser[] = [
  {
    id: 'staff-1',
    name: 'مريم الصاوي',
    email: 'admin@maisonlumiere.beauty',
    role: 'admin',
    phone: '01011112222',
    is_active: true,
    created_at: '2026-01-01T10:00:00Z',
    last_login_at: new Date().toISOString(),
  },
  {
    id: 'staff-2',
    name: 'فريدة عثمان',
    email: 'manager@maisonlumiere.beauty',
    role: 'manager',
    phone: '01022223333',
    is_active: true,
    created_at: '2026-01-15T10:00:00Z',
    last_login_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'staff-3',
    name: 'رنا نبيل',
    email: 'reception@maisonlumiere.beauty',
    role: 'receptionist',
    phone: '01033334444',
    is_active: true,
    created_at: '2026-02-01T10:00:00Z',
    last_login_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'staff-4',
    name: 'حبيبة رشوان',
    email: 'specialist1@maisonlumiere.beauty',
    role: 'specialist',
    phone: '01044445555',
    is_active: true,
    specialist_id: 'spec-1',
    created_at: '2026-02-10T10:00:00Z',
    last_login_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export function getLocalStaffUsers(): StaffUser[] {
  try {
    const raw = localStorage.getItem('maison_v2_staff_users');
    if (raw) return JSON.parse(raw);
    localStorage.setItem('maison_v2_staff_users', JSON.stringify(defaultStaffUsers));
    return defaultStaffUsers;
  } catch {
    return defaultStaffUsers;
  }
}

export function saveLocalStaffUser(staff: StaffUser) {
  const users = getLocalStaffUsers();
  const idx = users.findIndex((u) => u.id === staff.id);
  if (idx >= 0) {
    users[idx] = staff;
  } else {
    users.push(staff);
  }
  localStorage.setItem('maison_v2_staff_users', JSON.stringify(users));
}

export function resetLocalStaffPassword(userId: string, newPass: string) {
  // Store locally for demo mode password simulation
  localStorage.setItem(`maison_pass_${userId}`, newPass);
}

// ============================================================================
// Products / Inventory Helpers
// ============================================================================

export function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem('maison_v2_products');
    if (raw) return JSON.parse(raw);
    localStorage.setItem('maison_v2_products', JSON.stringify(defaultProducts));
    return defaultProducts;
  } catch {
    return defaultProducts;
  }
}

export function saveLocalProduct(product: Product) {
  const prods = getLocalProducts();
  const idx = prods.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    prods[idx] = product;
  } else {
    prods.unshift(product);
  }
  localStorage.setItem('maison_v2_products', JSON.stringify(prods));
}

export function deleteLocalProduct(productId: string) {
  const prods = getLocalProducts().filter((p) => p.id !== productId);
  localStorage.setItem('maison_v2_products', JSON.stringify(prods));
}

export function updateProductStock(productId: string, delta: number) {
  const prods = getLocalProducts();
  const p = prods.find((item) => item.id === productId);
  if (p) {
    p.stock_quantity = Math.max(0, p.stock_quantity + delta);
    saveLocalProduct(p);
  }
}

// ============================================================================
// Packages / Bundles Helpers
// ============================================================================

export function getLocalPackages(): Package[] {
  try {
    const raw = localStorage.getItem('maison_v2_packages');
    if (raw) return JSON.parse(raw);
    localStorage.setItem('maison_v2_packages', JSON.stringify(defaultPackages));
    return defaultPackages;
  } catch {
    return defaultPackages;
  }
}

export function saveLocalPackage(pkg: Package) {
  const packages = getLocalPackages();
  const idx = packages.findIndex((p) => p.id === pkg.id);
  if (idx >= 0) {
    packages[idx] = pkg;
  } else {
    packages.unshift(pkg);
  }
  localStorage.setItem('maison_v2_packages', JSON.stringify(packages));
}

export function deleteLocalPackage(pkgId: string) {
  const packages = getLocalPackages().filter((p) => p.id !== pkgId);
  localStorage.setItem('maison_v2_packages', JSON.stringify(packages));
}

// ============================================================================
// Business Settings & Logo Helpers
// ============================================================================

export function getLocalSettings(): BusinessSettings {
  try {
    const raw = localStorage.getItem('maison_v2_settings');
    if (raw) return JSON.parse(raw);
    localStorage.setItem('maison_v2_settings', JSON.stringify(defaultSettings));
    return defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveLocalSettings(settings: BusinessSettings) {
  localStorage.setItem('maison_v2_settings', JSON.stringify(settings));
}

// ============================================================================
// Customer Auth & Profiles
// ============================================================================

export function getCurrentCustomer(): CustomerUser | null {
  try {
    const raw = localStorage.getItem('maison_current_customer');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export function loginCustomer(phoneOrEmail: string, _pass: string): { ok: boolean; user?: CustomerUser; error?: string } {
  try {
    const rawUsers = localStorage.getItem('maison_registered_customers') || '[]';
    const users: CustomerUser[] = JSON.parse(rawUsers);
    const clean = phoneOrEmail.trim().replace(/\D/g, '');
    const user = users.find(
      (u) =>
        u.phone.replace(/\D/g, '') === clean ||
        (u.email && u.email.toLowerCase() === phoneOrEmail.trim().toLowerCase()),
    );
    if (!user) {
      // Allow demo fast sign in for any valid phone
      if (clean.length === 11) {
        const demoUser: CustomerUser = {
          id: 'cust-' + Date.now(),
          name: 'عميلة ميزون لوميير',
          phone: clean,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('maison_current_customer', JSON.stringify(demoUser));
        return { ok: true, user: demoUser };
      }
      return { ok: false, error: 'رقم الهاتف أو كلمة المرور غير صحيحة' };
    }
    localStorage.setItem('maison_current_customer', JSON.stringify(user));
    return { ok: true, user };
  } catch {
    return { ok: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
  }
}

export function registerCustomer(name: string, phone: string, email?: string): { ok: boolean; user?: CustomerUser; error?: string } {
  try {
    const rawUsers = localStorage.getItem('maison_registered_customers') || '[]';
    const users: CustomerUser[] = JSON.parse(rawUsers);
    const clean = phone.trim().replace(/\D/g, '');
    if (clean.length !== 11) {
      return { ok: false, error: 'يرجى إدخال رقم هاتف مصري صحيح (١١ رقم)' };
    }
    const newUser: CustomerUser = {
      id: 'cust-' + Date.now(),
      name: name.trim(),
      phone: clean,
      email: email?.trim() || null,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('maison_registered_customers', JSON.stringify(users));
    localStorage.setItem('maison_current_customer', JSON.stringify(newUser));
    return { ok: true, user: newUser };
  } catch {
    return { ok: false, error: 'حدث خطأ أثناء إنشاء الحساب' };
  }
}

export function logoutCustomer() {
  localStorage.removeItem('maison_current_customer');
}

// Backward compatibility alias:
export function saveLocalAppointment(payload: Record<string, any>) {
  const b: Booking = {
    id: payload.id || 'bkg-' + Date.now(),
    booking_number: payload.booking_number || `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    secret_token: payload.secret_token || 'tok-' + Date.now(),
    customer_name: payload.customer_name || payload.full_name || 'عميلة الصالون',
    customer_phone: payload.customer_phone || payload.phone || '01012345678',
    appointment_date: payload.appointment_date || new Date().toISOString().split('T')[0],
    start_time: payload.start_time || '14:00:00',
    end_time: payload.end_time || '15:00:00',
    subtotal_amount: payload.subtotal_amount || payload.price || 1500,
    discount_amount: payload.discount_amount || 0,
    total_amount: payload.total_amount || payload.price || 1500,
    deposit_required: payload.deposit_required || (payload.price ? payload.price / 2 : 750),
    deposit_paid: payload.deposit_paid || 0,
    status: payload.status || 'pending_verification',
    notes: payload.notes || null,
    created_at: new Date().toISOString(),
  };
  saveLocalBooking(b);
}

// --------------------------------------------------------------------------
// Staff Attendance System Helpers
// --------------------------------------------------------------------------

export const defaultAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    staff_id: 'staff-2',
    staff_name: 'سارة أحمد',
    role: 'specialist',
    date: new Date().toISOString().split('T')[0],
    clock_in: new Date(Date.now() - 3600000 * 5).toISOString(),
    clock_out: null,
    shift: 'morning',
    status: 'present',
    notes: 'حضور منتظم في الموعد',
  },
  {
    id: 'att-2',
    staff_id: 'staff-3',
    staff_name: 'مريم محمود',
    role: 'receptionist',
    date: new Date().toISOString().split('T')[0],
    clock_in: new Date(Date.now() - 3600000 * 5.5).toISOString(),
    clock_out: null,
    shift: 'morning',
    status: 'present',
    notes: 'استلام عهدة الخزينة وفتح الوردية',
  },
  {
    id: 'att-3',
    staff_id: 'staff-4',
    staff_name: 'ياسمين علي',
    role: 'specialist',
    date: new Date().toISOString().split('T')[0],
    clock_in: new Date(Date.now() - 3600000 * 4).toISOString(),
    clock_out: null,
    shift: 'morning',
    status: 'late',
    notes: 'تأخير نصف ساعة بإذن مسبق',
  },
  {
    id: 'att-4',
    staff_id: 'staff-5',
    staff_name: 'نورهان إبراهيم',
    role: 'specialist',
    date: new Date().toISOString().split('T')[0],
    clock_in: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    clock_out: null,
    shift: 'morning',
    status: 'present',
    notes: 'تجهيز أجنحة الحمام المغربي',
  },
];

export function getLocalAttendanceRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem('maison_staff_attendance');
    if (!raw) {
      localStorage.setItem('maison_staff_attendance', JSON.stringify(defaultAttendanceRecords));
      return defaultAttendanceRecords;
    }
    return JSON.parse(raw);
  } catch {
    return defaultAttendanceRecords;
  }
}

export function saveLocalAttendanceRecord(record: AttendanceRecord): void {
  const records = getLocalAttendanceRecords();
  const index = records.findIndex((r) => r.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.unshift(record);
  }
  localStorage.setItem('maison_staff_attendance', JSON.stringify(records));
}

export function deleteLocalAttendanceRecord(id: string): void {
  const records = getLocalAttendanceRecords().filter((r) => r.id !== id);
  localStorage.setItem('maison_staff_attendance', JSON.stringify(records));
}

export function clockInStaff(
  staffId: string,
  pin: string,
  shift: ShiftType = 'morning',
  notes?: string
): { success: boolean; record?: AttendanceRecord; error?: string } {
  const staffList = getLocalStaffUsers();
  const staff = staffList.find((s) => s.id === staffId);
  if (!staff) {
    return { success: false, error: 'الموظفة غير مسجلة بالنظام' };
  }

  // Validate PIN (default is '1234' or s.pin)
  const validPin = staff.pin || '1234';
  if (pin.trim() !== validPin && pin.trim() !== '1234') {
    return { success: false, error: 'رمز الـ PIN غير صحيح' };
  }

  const today = new Date().toISOString().split('T')[0];
  const records = getLocalAttendanceRecords();
  const existingActive = records.find(
    (r) => r.staff_id === staffId && r.date === today && !r.clock_out
  );
  if (existingActive) {
    return { success: false, error: 'الموظفة مسجلة حضور بالفعل حالياً' };
  }

  const now = new Date();
  const hours = now.getHours();
  let status: AttendanceStatus = 'present';
  if (shift === 'morning' && hours >= 10 && now.getMinutes() > 15) {
    status = 'late';
  } else if (shift === 'evening' && hours >= 16 && now.getMinutes() > 15) {
    status = 'late';
  }

  const newRecord: AttendanceRecord = {
    id: 'att-' + Date.now(),
    staff_id: staff.id,
    staff_name: staff.name,
    role: staff.role,
    date: today,
    clock_in: now.toISOString(),
    clock_out: null,
    shift,
    status,
    notes: notes || undefined,
  };

  saveLocalAttendanceRecord(newRecord);
  return { success: true, record: newRecord };
}

export function clockOutStaff(
  staffId: string,
  notes?: string
): { success: boolean; record?: AttendanceRecord; error?: string } {
  const today = new Date().toISOString().split('T')[0];
  const records = getLocalAttendanceRecords();
  const activeRecord = records.find(
    (r) => r.staff_id === staffId && r.date === today && !r.clock_out
  );

  if (!activeRecord) {
    return { success: false, error: 'لا يوجد تسجيل حضور نشط لهذه الموظفة اليوم' };
  }

  const now = new Date();
  const start = new Date(activeRecord.clock_in).getTime();
  const diffHours = Math.max(0.1, Math.round(((now.getTime() - start) / 3600000) * 10) / 10);

  const updated: AttendanceRecord = {
    ...activeRecord,
    clock_out: now.toISOString(),
    total_hours: diffHours,
    status: 'completed',
    notes: notes ? (activeRecord.notes ? `${activeRecord.notes} | ${notes}` : notes) : activeRecord.notes,
  };

  saveLocalAttendanceRecord(updated);
  return { success: true, record: updated };
}

export function getActiveStaffAttendance(): AttendanceRecord[] {
  const today = new Date().toISOString().split('T')[0];
  return getLocalAttendanceRecords().filter((r) => r.date === today && !r.clock_out);
}
