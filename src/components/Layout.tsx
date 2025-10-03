import { ReactNode } from "react";
import { FloatingDock } from "@/components/FloatingDock";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      <main className="w-full pl-24">
        {children}
      </main>
      <FloatingDock />
    </div>
  );
}
