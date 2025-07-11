
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LogOut, User, Bell, Search, Building2, Shield, Zap, Settings, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Header() {
  const { logout, user } = useAuth();

  return (
    <header className="bg-white border-b border-[#e0e0e0] shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo da Empresa e Branding */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0095da] to-[#313d5a] rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#0095da] rounded-full flex items-center justify-center">
                  <Shield className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-[#313d5a] tracking-wide">DW IT Solutions</h1>
                <p className="text-xs text-[#3a3a3c] font-medium">Sistema de Licenças</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-[#e0e0e0]"></div>
            
            {/* Barra de Pesquisa Modernizada */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3a3a3c] w-4 h-4" />
              <input
                type="text"
                placeholder="Pesquisar licenças, clientes..."
                className="pl-10 pr-4 py-2.5 w-96 bg-[#f4f4f4] border border-[#e0e0e0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0095da] focus:border-transparent transition-all duration-200 placeholder-[#3a3a3c]"
              />
            </div>
          </div>

          {/* Área do Usuário */}
          <div className="flex items-center space-x-4">
            {/* Notificações */}
            <button className="relative p-2.5 text-[#3a3a3c] hover:text-[#0095da] hover:bg-[#f4f4f4] rounded-xl transition-colors group">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#0095da] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
            </button>

            {/* Perfil do Usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-3 p-2 rounded-xl hover:bg-[#f4f4f4] transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#0095da] to-[#313d5a] rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-[#3a3a3c]">{user?.name || 'Admin'}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs bg-[#0095da] text-white border-[#0095da]">
                        {user?.role === 'admin' ? 'Admin' : 'Técnico'}
                      </Badge>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#3a3a3c]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white border border-[#e0e0e0] shadow-xl">
                <DropdownMenuLabel className="text-[#3a3a3c]">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#e0e0e0]" />
                <DropdownMenuItem className="text-[#3a3a3c] hover:bg-[#f4f4f4] hover:text-[#0095da]">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[#3a3a3c] hover:bg-[#f4f4f4] hover:text-[#0095da]">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#e0e0e0]" />
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
