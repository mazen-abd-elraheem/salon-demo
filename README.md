# 🌸 Maison Lumière — Beauty Atelier & Spa Management System
### ميزون لوميير • المنظومة السحابية المتكاملة لإدارة صالونات التجميل ومراكز السبا الفاخرة

A modern, full-stack, enterprise-grade Beauty Salon & Spa Web Application tailored for the Egyptian & Middle Eastern market. Built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## ✨ Key Features & Modules

### 1. 🌟 Public Luxury Booking Portal (بوابة الحجز الأونلاين الفاخرة)
- **Editorial Luxury Design**: Designed according to Haute Parfumerie & Spa aesthetic guidelines with **Alexandria** and **Tajawal** typography, zero visual clutter, and full Right-to-Left (RTL) balance.
- **Multi-Service & Package Cart**: Select multiple beauty and spa treatments in a single reservation session with real-time duration and total price calculations.
- **Automated 50% Deposit**: Calculates 50% confirmation deposit to secure specialists and private treatment suites.
- **Egyptian Payment Gateways**: Direct support for **InstaPay** (IPA address copy) and **Vodafone Cash** with proof screenshot upload (auto-compressed client-side under 100 KB).
- **Guest Booking & Client Auth**: Fast 1-click guest booking with 11-digit Egyptian phone validation, plus optional client login/registration to track past appointments.

### 2. 📱 In-Branch Smart QR Checkout (سداد الفاتورة الذكية بالفرع عبر QR)
- **Fast Dynamic QR Pass**: Customers scan a desk or screen QR code upon completing treatments to view their itemized digital Arabic invoice.
- **Exact Cash Tender & Change Calculation**: Cash customers enter the exact amount handed to cashier; system instantly calculates change due in EGP.
- **Same-Device Direct Opening**: Allows customers or cashiers on the same device/browser to inspect and settle open tabs with 1 tap without requiring a secondary camera.
- **Real-Time Settlement**: Upload transfer receipts or confirm cash handover with instant audio/visual verification alerts on the cashier screen.

### 3. 🏬 Reception & Cashier POS (شاشة الاستقبال والكاشير)
- **One-Click Check-In**: Lookup arriving customers by phone or Booking ID and activate active in-branch open tabs.
- **Live In-Branch Upselling (Open Tab)**: Add extra treatments (nail polish, hair revival) or retail beauty products directly to the active bill during the visit.
- **Deposit Verification**: 1-click approval for incoming InstaPay / Vodafone Cash transfers with instant WhatsApp receipt generator.
- **Shift Reconciliation**: Real-time drawer tracking separating Cash, Vodafone Cash, and InstaPay transactions.

### 4. ⏱️ Staff Attendance System (نظام حضور وانصراف الموظفات)
- **Reception POS Quick Clock-In/Out**: Fast 4-digit PIN clock-in for specialists and receptionists directly from the POS tablet.
- **Shift Management**: Automatic assignment to Morning (10:00 AM - 04:00 PM), Evening (04:00 PM - 10:00 PM), or Full Day shifts with automatic late-arrival flags.
- **Duration Tracking**: Live counter of active floor staff and precise working hours calculation upon clocking out.
- **Admin Attendance Suite (`/admin/attendance`)**: Date filtering, role filtering, search, manual attendance adjustment, and 1-click **Export to CSV**.

### 5. 👑 Comprehensive Admin Suite (لوحة تحكم الإدارة الشاملة)
- **Packages & Bundles (`/admin/packages`)**: Create and bundle multiple services with seasonal promotional pricing, duration calculations, and discount badges.
- **Retail & Inventory Management (`/admin/inventory`)**: Manage cosmetic products, stock counts, cost/sale prices, and low-stock alerts (< 5 units).
- **Role-Based Access Control - RBAC (`/admin/roles`)**: 4 distinct access tiers:
  1. `مدير عام (Admin)`
  2. `مديرة الفرع (Manager)`
  3. `موظفة استقبال وكاشير (Receptionist)`
  4. `أخصائية تجميل (Specialist)`
  With live role switching, password resets, and account suspension toggles.
- **Financial Reconciliation (`/admin/reconciliation`)**: Daily and shift closing reports with drawer reconciliation and exportable accounting summaries.
- **Salon Customization & Logo (`/admin/settings`)**: Live salon branding and logo upload with client-side canvas compression, automatically synced across the navbar, footer, reception, and invoices.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS (Tailwind typography, Alexandria & Tajawal fonts, custom zero-glow soft shadows)
- **State & Storage**: Supabase Database (PostgreSQL with RLS), Supabase Storage, and fallback LocalStorage synchronized state
- **Icons**: Lucide React
- **Audio Feedback**: Web Audio API synthesized chimes for realtime cashier alerts
- **SEO**: Schema.org `BeautySalon` JSON-LD structured data for local Cairo/Zamalek visibility

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/mazen-abd-elraheem/salon-demo.git
cd salon-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be running locally at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

---

## 🔐 Credentials & Default Demo Accounts

### Admin & Staff Login (`/admin`):
- **Email**: `admin@maisonlumiere.beauty` (or any admin user)
- **Password**: `admin123` (or PIN: `1234` for staff attendance)

---

## 📄 License
Private & Proprietary — Developed for Maison Lumière Beauty Atelier & Spa.

