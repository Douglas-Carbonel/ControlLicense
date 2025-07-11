
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LogOut, User, Bell, Search } from "lucide-react";

export default function Header() {
  const { logout, user } = useAuth();

  return (
    <header className="bg-white border-b border-[#e0e0e0] shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3a3a3c] w-4 h-4" />
              <input
                type="text"
                placeholder="Pesquisar licenças..."
                className="pl-10 pr-4 py-2 w-80 bg-[#f4f4f4] border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0095da] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-[#3a3a3c] hover:text-[#0095da] hover:bg-[#f4f4f4] rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#0095da] rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#3a3a3c]">{user?.name || 'Admin'}</span>
                <span className="text-xs text-[#3a3a3c]">{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="text-[#3a3a3c] hover:text-[#0095da] p-2 rounded-lg hover:bg-[#f4f4f4] transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
