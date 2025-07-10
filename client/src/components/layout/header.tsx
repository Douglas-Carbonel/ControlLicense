import { Bell, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Shield className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Sistema de Licenças</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                3
              </Badge>
            </Button>
            <Button variant="ghost" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JS</span>
              </div>
              <span className="text-gray-700 font-medium">João Silva</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
