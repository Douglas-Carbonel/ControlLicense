import { Link, useLocation } from "wouter";
import { Home, Tag, Upload, History, Users, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Navegação baseada no papel do usuário
const adminNavigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Licenças", href: "/licenses", icon: Tag },
  { name: "Importar Dados", href: "/import", icon: Upload },
  { name: "Histórico de Atividades", href: "/activities", icon: History },
  { name: "Usuários", href: "/users", icon: Users },
];

const supportNavigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Licenças", href: "/licenses", icon: Tag },
  { name: "Importar Dados", href: "/import", icon: Upload },
  { name: "Histórico de Atividades", href: "/activities", icon: History },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const navigation = isAdmin ? adminNavigation : supportNavigation;

  return (
    <aside className="w-64 bg-white shadow-md h-screen sticky top-0 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <div className="flex items-center space-x-2">
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {isAdmin ? "Admin" : "Suporte"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}