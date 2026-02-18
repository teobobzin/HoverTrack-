import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA / Offline Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Using the specific name requested by PWABuilder
      // Fix: Property 'worker' does not exist on type 'Navigator'. Use 'serviceWorker' instead.
      const registration = await navigator.serviceWorker.register('./pwabuilder-sw.js');
      console.log('MyHeliLogs SW registered: ', registration.scope);
    } catch (err) {
      console.log('MyHeliLogs SW registration failed: ', err);
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);