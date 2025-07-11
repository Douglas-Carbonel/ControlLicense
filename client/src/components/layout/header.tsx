import { Search } from "lucide-react";

export default function Header() {

  return (
    <header className="bg-white border-b border-[#e0e0e0] shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Barra de Pesquisa */}
          <div className="flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3a3a3c] w-4 h-4" />
              <input
                type="text"
                placeholder="Pesquisar licenças, clientes..."
                className="pl-10 pr-4 py-2.5 w-96 bg-[#f4f4f4] border border-[#e0e0e0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0095da] focus:border-transparent transition-all duration-200 placeholder-[#3a3a3c]"
              />
            </div>
          </div>

          {/* Placeholder para futuras funcionalidades */}
          <div className="flex items-center space-x-4">
          </div>
        </div>
      </div>
    </header>
  );
}