import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ReceptionPage from './pages/ReceptionPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/reception" element={<ReceptionPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/:token" element={<CheckoutPage />} />
      <Route path="/admin/*" element={<AdminPage />} />
    </Routes>
  );
}
