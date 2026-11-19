import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ReceptionPage from './pages/ReceptionPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';
import ReceptionGuard from './components/admin/ReceptionGuard';
import {
  AboutScreen,
  BookScreen,
  HowItWorksScreen,
  PackagesScreen,
  ProductsScreen,
  ServicesScreen,
} from './pages/MenuScreens';
import { LegalPage } from './pages/LegalPages';

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
    </>
  );
}
