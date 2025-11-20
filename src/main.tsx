// Application Entry Point - BUILD v11 - Complete Cache Clear
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import logoIcon from "@/assets/forswags-logo.png";

// Ensure favicon uses bundled asset path so it works in all environments
const setFavicon = (href: string) => {
  if (typeof document === "undefined") return;

  const ensureLink = (rel: string, type?: string) => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      if (type) link.type = type;
      document.head.appendChild(link);
    }
    if (type) link.type = type;
    link.href = href;
  };

  ensureLink("icon", "image/png");
  ensureLink("shortcut icon", "image/png");
  ensureLink("apple-touch-icon", "image/png");
};

// Version check - force reload if version mismatch
const CURRENT_VERSION = 'v12';
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
