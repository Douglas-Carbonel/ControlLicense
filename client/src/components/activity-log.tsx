import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Upload, Trash2, Globe, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ActivityLog() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
    staleTime: 30 * 1000, // 30 segundos - mais frequente para atividades
    gcTime: 2 * 60 * 1000, // 2 minutos para garbage collection
    refetchOnWindowFocus: true, // Atualizar quando focar na janela
    refetchInterval: 60 * 1000, // Atualizar a cada 1 minuto
  });

  if (isLoading) {
    return (
      <Card className="bg-white border border-[#e0e0e0] shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-[#3a3a3c]">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-[#f4f4f4] rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return Plus;
      case "UPDATE":
        return Edit;
      case "DELETE":
        return Trash2;
      case "IMPORT":
        return Upload;
      case "QUERY":
        return Globe;
      case "QUERY_ENCRYPTED":
        return Shield;
      default:
        return Plus;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-[#0095da]";
      case "UPDATE":
        return "bg-[#313d5a]";
      case "DELETE":
        return "bg-red-500";
      case "IMPORT":
        return "bg-emerald-500";
      case "QUERY":
        return "bg-blue-500";
      case "QUERY_ENCRYPTED":
        return "bg-purple-600";
      default:
        return "bg-[#3a3a3c]";
    }
  };

  const formatActivityDescription = (activity: any) => {
    if (activity.action === "QUERY" || activity.action === "QUERY_ENCRYPTED") {
      // Extrair informações da descrição original
      const description = activity.description || "";
      const hardwareMatch = description.match(/hardware: ([A-Z0-9]+)/);
      const countMatch = description.match(/(\d+) licenças encontradas/);
      
      const title = activity.action === "QUERY_ENCRYPTED" ? "Requisição de licença (Criptografada)" : "Requisição de licença";
      const hardware = hardwareMatch ? hardwareMatch[1] : "Hardware não identificado";
      const count = countMatch ? countMatch[1] : "0";
      
      return {
        title,
        details: `Hardware: ${hardware} • ${count} licenças encontradas`
      };
    }
    
    return {
      title: activity.description || "Sem descrição",
      details: null
    };
  };

  return (
    <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-slate-800">Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-mb-8">
            {Array.isArray(activities) && activities.length > 0 ? (
              activities.map((activity: any, index: number) => {
                const Icon = getActivityIcon(activity.action);
                const isLast = index === activities.length - 1;
                
                return (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"></span>
                      )}
                      <div className="relative flex space-x-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getActivityColor(activity.action)}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5">
                          <div>
                            {(() => {
                              const formatted = formatActivityDescription(activity);
                              return (
                                <>
                                  <p className="text-sm font-medium text-gray-900">{formatted.title}</p>
                                  {formatted.details && (
                                    <p className="text-xs text-gray-600 mt-0.5">{formatted.details}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {activity.timestamp ? 
                                      format(new Date(activity.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) 
                                      : 'Data não disponível'
                                    }
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="text-center py-8 text-gray-500">
                {activities === null || activities === undefined ? 'Carregando atividades...' : 'Nenhuma atividade encontrada'}
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
