import { defineCustomElements } from '@ionic/pwa-elements/loader';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Capacitor Global Fetch Interceptor to route /api requests to the Cloudflare server
// only if running natively in Android/iOS
if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    if (url.startsWith('/api')) {
      url = `https://garudatrisulaperkasa.web.id${url}`;
      if (typeof input === 'string') {
        input = url;
      } else if (input instanceof Request) {
        input = new Request(url, init || input);
      } else {
        input = url;
      }
    }
    
    return originalFetch(input, init);
  };
}

defineCustomElements(window);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
