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
  Building2,
  ChevronLeft,
  Menu,
  LogOut,
  ChevronDown,
  ChevronUp,
  User,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/permissions";
import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { canAccessMenu } = usePermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Query para buscar contagem de atividades não lidas
  const { data: unreadData, refetch: refetchUnreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/activities/unread-count"],
    staleTime: 10 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 20 * 1000, // Verificar a cada 20 segundos
    enabled: user?.role === 'admin', // Apenas para administradores
  });

  const newLogsCount = unreadData?.count || 0;

  // Forçar atualização quando houver mudanças no sistema
  useEffect(() => {
    const handleActivityUpdate = () => {
      if (user?.role === 'admin') {
        refetchUnreadCount();
      }
    };

    // Escutar eventos customizados
    window.addEventListener('activityUpdate', handleActivityUpdate as EventListener);
    
    return () => {
      window.removeEventListener('activityUpdate', handleActivityUpdate as EventListener);
    };
  }, [refetchUnreadCount, user?.role]);

  const navigationItems = useMemo(() => {
    const allItems = [
      { 
        href: "/", 
        label: "Painel", 
        icon: Home,
        description: "Visão geral do sistema",
        menuId: "dashboard"
      },
      { 
        href: "/licenses", 
        label: "Licenças", 
        icon: FileText,
        description: "Gerenciar licenças",
        menuId: "licenses"
      },
      { 
        href: "/mensagens", 
        label: "Mensagens", 
        icon: MessageSquare,
        description: "Gerenciar mensagens do sistema",
        menuId: "mensagens"
      },
      { 
        href: "/clientes", 
        label: "Clientes", 
        icon: Building2,
        description: "Histórico e suporte aos clientes",
        menuId: "clientes"
      },
      { 
        href: "/activities", 
        label: "Logs", 
        icon: Activity,
        description: "Logs e histórico de ações",
        menuId: "activities",
        badge: newLogsCount > 0 ? newLogsCount : null
      },
      {
        href: "/users",
        label: "Usuários",
        icon: Users,
        description: "Gerenciar usuários",
        menuId: "users"
      }
    ];

    // Filtrar itens baseado em permissões
    return allItems.filter(item => canAccessMenu(item.menuId));
  }, [canAccessMenu, newLogsCount]);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const getCurrentPageTitle = () => {
    // You can implement logic here to determine the current page title
    // based on the location or any other relevant information.
    // For now, let's return a default title.
    return "Sistema de Gestão";
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-[#313d5a] to-[#2a3548] border-r border-[#3a3a3c]/50 h-screen shadow-2xl flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Header Section */}
      <div className={`${isCollapsed ? 'p-4' : 'p-8'} border-b border-[#3a3a3c]/30 relative transition-all duration-300`}>
        {/* Collapse Toggle Button */}
        <button
          onClick={handleToggleCollapse}
          className={`absolute ${isCollapsed ? 'top-20 left-1/2 transform -translate-x-1/2' : 'top-4 right-4'} w-8 h-8 bg-[#3a3a3c]/50 hover:bg-[#3a3a3c]/80 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 z-10`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-white" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white" />
          )}
        </button>

        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
          <div className="relative">
            <div className={`${isCollapsed ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-[#0095da] via-[#33a9e6] to-[#0075b0] rounded-3xl flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 border-2 border-white/30 backdrop-blur-sm relative overflow-hidden group`}>
              {/* Background geometric pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 rounded-3xl"></div>
              <div className="absolute top-1 left-1 w-3 h-3 bg-white/20 rounded-full blur-sm"></div>
              <div className="absolute bottom-2 right-2 w-2 h-2 bg-white/30 rounded-full blur-sm"></div>

              {/* Modern DWU text */}
              <div className="relative z-10 flex items-center justify-center">
                <span className={`text-white font-black ${isCollapsed ? 'text-sm' : 'text-lg'} tracking-[-0.05em] drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-300`} 
                      style={{ 
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                        textShadow: '0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
                        letterSpacing: '-1px'
                      }}>
                  DWU
                </span>
              </div>

              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
            </div>

            {/* Status indicator with modern design */}
            <div className={`absolute -top-2 -right-2 ${isCollapsed ? 'w-4 h-4' : 'w-6 h-6'} bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 rounded-full border-2 border-[#313d5a] shadow-lg flex items-center justify-center transition-all duration-300`}>
              <div className={`${isCollapsed ? 'w-2 h-2' : 'w-3 h-3'} bg-white rounded-full animate-pulse shadow-inner`}></div>
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                DWU IT Solutions
              </h2>
              <p className="text-[#a1b3d3] text-sm font-medium mt-1 leading-tight">
                Controle de Licenças
              </p>
            </div>
          )}
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
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 ease-out relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#0095da] to-[#0075b0] text-white shadow-lg shadow-blue-500/25 scale-[1.02]' 
                    : 'text-[#a1b3d3] hover:bg-[#3a3a3c]/40 hover:text-white hover:shadow-md hover:scale-[1.01]'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                  <div className={`relative p-2 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20 shadow-inner' 
                      : 'group-hover:bg-[#0095da]/20'
                  }`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {/* Badge de notificação */}
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        {item.badge > 99 ? '99+' : item.badge}
                      </div>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="font-medium tracking-wide">{item.label}</span>
                      {item.badge && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 bg-red-500 text-white text-xs px-2 py-1 animate-pulse"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Active indicator */}
                {isActive && !isCollapsed && !item.badge && (
                  <div className="w-2 h-2 bg-white rounded-full shadow-sm animate-pulse"></div>
                )}

                {/* Hover indicator */}
                {!isActive && !isCollapsed && !item.badge && (
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                )}

                {/* Active indicator for collapsed state */}
                {isActive && isCollapsed && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-full shadow-sm"></div>
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

      {/* User Profile Section - Simple Footer with Logout */}
      <div className="p-6 border-t border-[#3a3a3c]/30 bg-gradient-to-b from-[#2a3548]/30 to-[#313d5a]/60 backdrop-blur-sm">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0095da] via-[#33a9e6] to-[#0075b0] rounded-xl flex items-center justify-center shadow-lg border-2 border-white/20">
                <span className="text-white text-sm font-bold drop-shadow-lg">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="text-base font-semibold text-white tracking-wide">
                {user?.username || 'admin'}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`flex items-center ${isCollapsed ? 'flex-col space-y-2' : 'space-x-2'}`}>
            {/* Settings Button with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`group ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'} bg-gradient-to-br from-[#3a3a3c]/40 to-[#3a3a3c]/20 hover:from-[#0095da]/20 hover:to-[#0075b0]/20 rounded-xl flex items-center justify-center border border-[#3a3a3c]/50 hover:border-[#0095da]/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#0095da]/10 transform hover:scale-105 active:scale-95`}
                  title="Configurações"
                >
                  <Settings className="w-4 h-4 text-[#a1b3d3] group-hover:text-white transition-colors duration-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="top" 
                align="start" 
                className="w-60 bg-gradient-to-b from-[#2a3548] to-[#313d5a] backdrop-blur-md border border-[#3a3a3c]/60 shadow-2xl shadow-black/40 mb-2 rounded-2xl text-white"
                sideOffset={8}
              >
                <DropdownMenuLabel className="text-white p-4 border-b border-[#3a3a3c]/30">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-[#0095da]" />
                    <span className="font-bold text-base">Configurações</span>
                  </div>
                </DropdownMenuLabel>
                <div className="p-2">
                  <DropdownMenuItem className="text-white hover:bg-[#3a3a3c]/50 hover:text-[#0095da] transition-all duration-200 rounded-xl p-3 mb-1">
                    <User className="mr-3 h-5 w-5" />
                    <span className="font-medium">Perfil do Usuário</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-[#3a3a3c]/50 hover:text-[#0095da] transition-all duration-200 rounded-xl p-3 mb-1">
                    <Database className="mr-3 h-5 w-5" />
                    <span className="font-medium">Configurações do Sistema</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-[#3a3a3c]/50 hover:text-[#0095da] transition-all duration-200 rounded-xl p-3 mb-1">
                    <Shield className="mr-3 h-5 w-5" />
                    <span className="font-medium">Segurança</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-[#3a3a3c]/50 hover:text-[#0095da] transition-all duration-200 rounded-xl p-3">
                    <BarChart3 className="mr-3 h-5 w-5" />
                    <span className="font-medium">Relatórios</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`group ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'} bg-gradient-to-br from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 rounded-xl flex items-center justify-center border border-red-500/30 hover:border-red-400/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/20 transform hover:scale-105 active:scale-95`}
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4 text-red-300 group-hover:text-red-200 transition-colors duration-300" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default memo(Sidebar);