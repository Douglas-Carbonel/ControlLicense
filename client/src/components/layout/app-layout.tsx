
import { ReactNode } from "react";
import Header from "./header";
import Sidebar from "./sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 professional-container">
          <div className="animate-slide-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
