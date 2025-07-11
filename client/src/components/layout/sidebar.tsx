
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
  Database
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

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 h-screen shadow-sm">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg text-slate-800 font-bold">DWU License</h2>
          </div>
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href} className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'
              }`}>
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200">
          <div className="flex items-center px-3 py-2">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
              <Database className="w-4 h-4 text-slate-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-slate-800">
                {user?.name || 'Administrador'}
              </div>
              <div className="text-xs text-slate-500">
                {user?.role === 'admin' ? 'Administrador' : 'Técnico'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
