import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

// Gracefully handle any legacy hash routes (e.g. /#/reception -> /reception)
if (window.location.hash && window.location.hash.startsWith('#/')) {
  const newPath = window.location.hash.slice(1);
  window.history.replaceState(null, '', newPath);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
