
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
      label: "Dashboard", 
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
    <aside className="w-64 bg-white border-r border-gray-200 h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">LicenseManager</h2>
          </div>
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? 'bg-primary text-white' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}>
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200">
          <div className="flex items-center px-3 py-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Database className="w-4 h-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">
                {user?.name || 'Administrador'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrador' : 'Técnico'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
