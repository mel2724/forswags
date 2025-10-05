import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handler for React HMR dispatcher errors
window.addEventListener('error', (event) => {
  if (event.message?.includes('dispatcher is null') || 
      event.error?.message?.includes('dispatcher is null')) {
    console.log('HMR dispatcher error caught - reloading...');
    event.preventDefault();
    window.location.reload();
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('dispatcher is null')) {
    console.log('HMR dispatcher promise error caught - reloading...');
    event.preventDefault();
    window.location.reload();
  }
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed silently
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
