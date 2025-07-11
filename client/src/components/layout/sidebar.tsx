import { Link, useLocation } from "wouter";
import { 
  Home, 
  FileText, 
  Upload, 
  Activity, 
  Users, 
  Settings,
  BarChart3,
  Shield,
  Database,
  ChevronRight,
  Building2
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    { 
      href: "/", 
      label: "Painel", 
      icon: Home,
      description: "Visão geral do sistema"
    },
    { 
      href: "/licenses", 
      label: "Licenças", 
      icon: FileText,
      description: "Gerenciar licenças"
    },
    { 
      href: "/import", 
      label: "Importar Dados", 
      icon: Upload,
      description: "Importar planilhas"
    },
    { 
      href: "/activities", 
      label: "Atividades", 
      icon: Activity,
      description: "Histórico de ações"
    },
  ];

  // Adicionar item de usuários apenas para administradores
  if (user?.role === 'admin') {
    navigationItems.push({
      href: "/users",
      label: "Usuários",
      icon: Users,
      description: "Gerenciar usuários"
    });
  }

  const getCurrentPageTitle = () => {
    // You can implement logic here to determine the current page title
    // based on the location or any other relevant information.
    // For now, let's return a default title.
    return "Sistema de Gestão";
  };

  return (
    <aside className="w-72 bg-gradient-to-b from-[#313d5a] to-[#2a3548] border-r border-[#3a3a3c]/50 h-screen shadow-2xl flex flex-col">
      {/* Header Section */}
      <div className="p-8 border-b border-[#3a3a3c]/30">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-[#0095da] via-[#007bb8] to-[#0075b0] rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/20">
              <span className="text-white font-black text-xl tracking-tighter drop-shadow-lg" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                DW
              </span>
            </div>
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-3 border-[#313d5a] shadow-lg animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
              DW IT License
            </h2>
            <p className="text-[#a1b3d3] text-sm font-medium mt-1 leading-tight">
              {getCurrentPageTitle()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-6 py-8">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`group flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 ease-out relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#0095da] to-[#0075b0] text-white shadow-lg shadow-blue-500/25 scale-[1.02]' 
                    : 'text-[#a1b3d3] hover:bg-[#3a3a3c]/40 hover:text-white hover:shadow-md hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20 shadow-inner' 
                      : 'group-hover:bg-[#0095da]/20'
                  }`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <span className="font-medium tracking-wide">{item.label}</span>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full shadow-sm animate-pulse"></div>
                )}

                {/* Hover indicator */}
                {!isActive && (
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                )}

                {/* Background decoration */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ${
                  isActive ? 'hidden' : ''
                }`}></div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="p-6 border-t border-[#3a3a3c]/30 bg-gradient-to-r from-[#2a3548]/50 to-[#313d5a]/50">
        <div className="flex items-center space-x-4 p-4 rounded-xl bg-[#3a3a3c]/30 backdrop-blur-sm border border-[#3a3a3c]/50 hover:bg-[#3a3a3c]/50 transition-all duration-300">
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-[#0095da] to-[#0075b0] rounded-full flex items-center justify-center shadow-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-[#313d5a] animate-pulse"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {user?.name || 'Administrador'}
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-[#a1b3d3] font-medium">
                {user?.role === 'admin' ? 'Administrador' : 'Técnico'}
              </div>
              <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
              <div className="text-xs text-emerald-400 font-medium">Online</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}