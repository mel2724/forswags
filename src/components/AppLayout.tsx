import React from "react";
import { ChatWidget } from "./ChatWidget";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
