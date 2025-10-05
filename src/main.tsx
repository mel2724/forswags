import React, { StrictMode, Component, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Top-level error boundary specifically for HMR errors
class HMRErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if it's an HMR dispatcher error
    if (error?.message?.includes('dispatcher is null') || 
        error?.message?.includes('useContext') ||
        error?.message?.includes('useState') ||
        error?.message?.includes('useEffect')) {
      console.log('HMR error detected in boundary - reloading immediately');
      // Reload without showing error state
      window.location.reload();
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Top-level error caught:', error, errorInfo);
    if (error?.message?.includes('dispatcher is null')) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

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
    <HMRErrorBoundary>
      <App />
    </HMRErrorBoundary>
  </StrictMode>
);
