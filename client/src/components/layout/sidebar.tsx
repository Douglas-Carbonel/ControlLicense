import { Link, useLocation } from "wouter";
import { Home, Tag, Upload, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Licenças", href: "/licenses", icon: Tag },
  { name: "Importar Dados", href: "/import", icon: Upload },
  { name: "Histórico de Atividades", href: "/activities", icon: History },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-md h-screen sticky top-0">
      <nav className="mt-8 px-4">
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
    </aside>
  );
}
