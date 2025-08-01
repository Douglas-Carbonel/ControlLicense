
import { ReactNode } from "react";
import Header from "./header";
import Sidebar from "./sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f4f4f4]">
            <div className="max-w-full mx-auto px-4 py-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
