
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
    <aside className="w-72 sidebar-professional">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 professional-gradient rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">LicenseManager</h2>
            <p className="text-xs text-muted-foreground">Sistema Profissional</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <a className={`sidebar-nav-item group ${isActive ? 'active' : ''}`}>
                  <div className="flex items-center space-x-3 flex-1">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-outline">
          <div className="professional-card bg-primary/5 border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">Status do Sistema</div>
                <div className="text-xs text-muted-foreground">Funcionando perfeitamente</div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="professional-card bg-muted/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">Usuário</div>
                <div className="text-xs text-muted-foreground truncate">
                  {user?.name || 'Administrador'}
                </div>
                <div className="text-xs text-primary font-medium">
                  {user?.role === 'admin' ? 'Administrador' : 'Técnico'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
