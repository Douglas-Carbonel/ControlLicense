import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, CheckCircle, AlertTriangle, XCircle, ArrowUp, ArrowDown } from "lucide-react";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/licenses/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Clientes",
      value: stats?.total || 0,
      change: "+12%",
      positive: true,
      icon: Tag,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Licenças Ativas",
      value: stats?.active || 0,
      change: "+8%",
      positive: true,
      icon: CheckCircle,
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
    },
    {
      title: "Licenças Inativas",
      value: stats?.inactive || 0,
      change: "+15%",
      positive: false,
      icon: AlertTriangle,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-500",
    },
    {
      title: "Total de Licenças",
      value: stats?.totalLicenseCount || 0,
      change: "-5%",
      positive: true,
      icon: XCircle,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        const ArrowIcon = card.positive ? ArrowUp : ArrowDown;
        
        return (
          <Card key={card.title} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium flex items-center ${card.positive ? 'text-green-500' : 'text-red-500'}`}>
                  <ArrowIcon className="h-3 w-3 mr-1" />
                  {card.change}
                </span>
                <span className="text-gray-600 text-sm ml-2">vs. mês anterior</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
