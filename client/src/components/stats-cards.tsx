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
  const cards = [
    {
      title: "Total de Licenças",
      value: stats.total,
      icon: FileText,
      color: "bg-blue-500/10 text-blue-600",
      iconBg: "bg-blue-500/20",
      description: "Licenças cadastradas"
    },
    {
      title: "Licenças Ativas",
      value: stats.active,
      icon: CheckCircle,
      color: "bg-green-500/10 text-green-600",
      iconBg: "bg-green-500/20",
      description: "Funcionando normalmente"
    },
    {
      title: "Licenças Inativas",
      value: stats.inactive,
      icon: XCircle,
      color: "bg-red-500/10 text-red-600",
      iconBg: "bg-red-500/20",
      description: "Requerem atenção"
    },
    {
      title: "Próximas ao Vencimento",
      value: stats.expiring || 0,
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-600",
      iconBg: "bg-yellow-500/20",
      description: "Nos próximos 30 dias"
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="professional-card hover:scale-105 transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`stats-icon ${card.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{card.value}</div>
                  <div className="text-xs text-muted-foreground">{card.description}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${card.color}`}>
                  <div className="w-2 h-2 rounded-full bg-current mr-1"></div>
                  Atualizado agora
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}