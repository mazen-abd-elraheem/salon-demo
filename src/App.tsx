import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ReceptionGuard from './components/admin/ReceptionGuard';

// Route-level code splitting: Admin, Reception POS, Checkout, Auth, and sub-screens
// are loaded on demand so the public landing page stays ultra-fast.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ReceptionPage = lazy(() => import('./pages/ReceptionPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const LegalPage = lazy(() =>
  import('./pages/LegalPages').then((m) => ({ default: m.LegalPage })),
);
const ServicesScreen = lazy(() =>
  import('./pages/MenuScreens').then((m) => ({ default: m.ServicesScreen })),
);
const PackagesScreen = lazy(() =>
  import('./pages/MenuScreens').then((m) => ({ default: m.PackagesScreen })),
);
const ProductsScreen = lazy(() =>
  import('./pages/MenuScreens').then((m) => ({ default: m.ProductsScreen })),
);
const HowItWorksScreen = lazy(() =>
  import('./pages/MenuScreens').then((m) => ({ default: m.HowItWorksScreen })),
);
const AboutScreen = lazy(() =>
  import('./pages/MenuScreens').then((m) => ({ default: m.AboutScreen })),
);
const BookScreen = lazy(() =>
  import('./pages/MenuScreens').then((m) => ({ default: m.BookScreen })),
);

function RouteSkeleton() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: 'var(--mainbg, #f9f0f5)', color: 'var(--fonts-100, #3a1d43)' }}
      aria-busy="true"
    >
      <div className="w-full max-w-md space-y-4">
        <div className="h-10 w-40 mx-auto rounded-full animate-pulse bg-[#e8d7e4]" />
        <div className="h-44 w-full rounded-3xl animate-pulse bg-white/80 border border-[#e8d7e4]" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-2xl animate-pulse bg-white/75 border border-[#e8d7e4]" />
          <div className="h-20 rounded-2xl animate-pulse bg-white/75 border border-[#e8d7e4]" />
        </div>
      </div>
    </div>
  );
}

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTopOnNavigate />
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesScreen />} />
          <Route path="/packages" element={<PackagesScreen />} />
          <Route path="/products" element={<ProductsScreen />} />
          <Route path="/how-it-works" element={<HowItWorksScreen />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="/book" element={<BookScreen />} />
          <Route path="/legal/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/legal/terms" element={<LegalPage type="terms" />} />
          <Route path="/legal/cookies" element={<LegalPage type="cookies" />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route
            path="/reception"
            element={
              <ReceptionGuard>
                <ReceptionPage />
              </ReceptionGuard>
            }
          />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/:token" element={<CheckoutPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
