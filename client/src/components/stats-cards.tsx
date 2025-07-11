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
      color: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
      description: "Licenças cadastradas"
    },
    {
      title: "Licenças Ativas",
      value: safeStats.active,
      icon: CheckCircle,
      color: "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700",
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
      description: "Funcionando normalmente"
    },
    {
      title: "Licenças Inativas",
      value: safeStats.inactive,
      icon: XCircle,
      color: "bg-gradient-to-br from-red-50 to-red-100 text-red-700",
      iconBg: "bg-gradient-to-br from-red-500 to-red-600 text-white",
      description: "Requerem atenção"
    },
    {
      title: "Próximas ao Vencimento",
      value: safeStats.expiring || 0,
      icon: Clock,
      color: "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700",
      iconBg: "bg-gradient-to-br from-amber-500 to-amber-600 text-white",
      description: "Nos próximos 30 dias"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-slate-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-800">{card.value}</p>
                  <p className="text-xs text-slate-500">{card.description}</p>
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