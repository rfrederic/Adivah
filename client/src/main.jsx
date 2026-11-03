import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyStoredLanguage } from '@/lib/routes';
import App from './App';
import './index.css';

// À appliquer avant l'initialisation d'i18n, qui lit la langue dans l'URL.
applyStoredLanguage();
await import('./i18n');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
