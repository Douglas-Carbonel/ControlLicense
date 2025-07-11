
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LogOut, User, Bell, Search } from "lucide-react";

export default function Header() {
  const { logout, user } = useAuth();

  return (
    <header className="bg-surface border-b border-outline professional-shadow-lg sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar licenças, clientes..."
                  className="form-input pl-10 w-80 bg-muted/50 border-outline/50"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>

            <div className="flex items-center space-x-3 px-3 py-2 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-foreground">
                  {user?.name || 'Administrador'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user?.role === 'admin' ? 'Administrador' : 'Técnico'}
                </div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline ml-2">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
