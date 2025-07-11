import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { memo } from "react";

interface StatsCardsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    expiring?: number;
    uniqueClients?: number;
  };
  isLoading?: boolean;
}

function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  // Provide default values if stats is undefined
  const safeStats = stats || {
    total: 0,
    active: 0,
    inactive: 0,
    expiring: 0,
    uniqueClients: 0
  };
  const cards = [
    {
      title: "Total de Licenças",
      value: safeStats.total,
      icon: FileText,
      color: "bg-gradient-to-br from-blue-50 to-blue-100 text-[#0095da]",
      iconBg: "bg-[#0095da] text-white",
      description: "Licenças cadastradas"
    },
    {
      title: "Licenças Ativas",
      value: safeStats.active,
      icon: CheckCircle,
      color: "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700",
      iconBg: "bg-emerald-500 text-white",
      description: "Funcionando normalmente"
    },
    {
      title: "Licenças Inativas",
      value: safeStats.inactive,
      icon: XCircle,
      color: "bg-gradient-to-br from-gray-50 to-gray-100 text-[#313d5a]",
      iconBg: "bg-[#313d5a] text-white",
      description: "Requerem atenção"
    },
    {
      title: "Clientes Cadastrados",
      value: safeStats.uniqueClients || 0,
      icon: Clock,
      color: "bg-gradient-to-br from-gray-50 to-gray-100 text-[#3a3a3c]",
      iconBg: "bg-[#3a3a3c] text-white",
      description: "Códigos únicos"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="bg-white border border-[#e0e0e0] hover:shadow-lg transition-all duration-200 hover:border-[#0095da]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#3a3a3c] mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-[#3a3a3c]">
                    {isLoading ? "..." : card.value}
                  </p>
                  <p className="text-xs text-[#3a3a3c]">{card.description}</p>
                </div>
                <div className={`p-3 rounded-full shadow-sm ${card.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default memo(StatsCards);