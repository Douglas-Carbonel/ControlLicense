import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";

interface StatsCardsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    expiring?: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  // Provide default values if stats is undefined
  const safeStats = stats || {
    total: 0,
    active: 0,
    inactive: 0,
    expiring: 0
  };
  const cards = [
    {
      title: "Total de Licenças",
      value: safeStats.total,
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
      iconBg: "bg-blue-500/20",
      description: "Licenças cadastradas"
    },
    {
      title: "Licenças Ativas",
      value: safeStats.active,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
      iconBg: "bg-green-500/20",
      description: "Funcionando normalmente"
    },
    {
      title: "Licenças Inativas",
      value: safeStats.inactive,
      icon: XCircle,
      color: "bg-red-100 text-red-600",
      iconBg: "bg-red-500/20",
      description: "Requerem atenção"
    },
    {
      title: "Próximas ao Vencimento",
      value: safeStats.expiring || 0,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
      iconBg: "bg-yellow-500/20",
      description: "Nos próximos 30 dias"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
                <div className={`p-3 rounded-full ${card.color}`}>
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