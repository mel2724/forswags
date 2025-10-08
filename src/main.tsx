// Application Entry Point - BUILD v10 - Cache Clear
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Version check - force reload if version mismatch
const CURRENT_VERSION = 'v10';
const storedVersion = sessionStorage.getItem('app_version');
if (storedVersion && storedVersion !== CURRENT_VERSION) {
  sessionStorage.setItem('app_version', CURRENT_VERSION);
  window.location.reload();
} else if (!storedVersion) {
  sessionStorage.setItem('app_version', CURRENT_VERSION);
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed silently
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
