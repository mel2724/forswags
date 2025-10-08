// Application Entry Point - BUILD v11 - Complete Cache Clear
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Version check - force reload if version mismatch
const CURRENT_VERSION = 'v11';
const storedVersion = sessionStorage.getItem('app_version');
if (storedVersion && storedVersion !== CURRENT_VERSION) {
  sessionStorage.setItem('app_version', CURRENT_VERSION);
  // Clear all caches before reload
  if ('caches' in window) {
    caches.keys().then(keys => {
      keys.forEach(key => caches.delete(key));
    });
  }
  window.location.reload();
} else if (!storedVersion) {
  sessionStorage.setItem('app_version', CURRENT_VERSION);
}

// Unregister old service workers and register new one
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    }).then(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed silently
      });
    });
  });
}

// Force clear any React module cache
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
