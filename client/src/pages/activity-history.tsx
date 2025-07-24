import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Upload, Trash2, Globe, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ActivityHistory() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
    staleTime: 30 * 1000, // 30 segundos - mais frequente para atividades
    gcTime: 2 * 60 * 1000, // 2 minutos para garbage collection
    refetchOnWindowFocus: true, // Atualizar quando focar na janela
    refetchInterval: 60 * 1000, // Atualizar a cada 1 minuto
  });

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
        return "default";
      case "UPDATE":
        return "secondary";
      case "DELETE":
        return "destructive";
      case "IMPORT":
        return "outline";
      case "QUERY":
        return "default";
      case "QUERY_ENCRYPTED":
        return "secondary";
      default:
        return "default";
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "CREATE":
        return "Criação";
      case "UPDATE":
        return "Atualização";
      case "DELETE":
        return "Exclusão";
      case "IMPORT":
        return "Importação";
      case "QUERY":
        return "Consulta API";
      case "QUERY_ENCRYPTED":
        return "Consulta Criptografada";
      default:
        return action;
    }
  };

  const formatActivityDescription = (activity: any) => {
    if (activity.action === "QUERY" || activity.action === "QUERY_ENCRYPTED") {
      // Extrair informações da descrição original com novo formato
      const description = activity.description || "";
      
      // Novo formato com pipe separador
      const hardwareMatch = description.match(/Hardware: ([A-Z0-9]+)/);
      const systemMatch = description.match(/System: ([A-Z0-9]+)/);
      const installMatch = description.match(/Install: ([A-Z0-9]+)/);
      const databaseMatch = description.match(/Database: "([^"]*?)"/);
      const countMatch = description.match(/(\d+) licenças encontradas/);
      const isError = description.includes("(ERRO)");
      
      let title = activity.action === "QUERY_ENCRYPTED" ? "Requisição de licença (Criptografada)" : "Requisição de licença";
      if (isError) {
        title += " - ERRO";
      }
      
      const hardware = hardwareMatch ? hardwareMatch[1] : "N/A";
      const system = systemMatch ? systemMatch[1] : "N/A";
      const install = installMatch ? installMatch[1] : "N/A";
      const database = databaseMatch ? (databaseMatch[1] || "vazio") : "N/A";
      const count = countMatch ? countMatch[1] : "0";
      
      return {
        title,
        details: `Hardware: ${hardware} • System: ${system} • Install: ${install} • Database: ${database} • Resultado: ${count} licenças encontradas`,
        isError
      };
    }
    
    return {
      title: activity.description || "Sem descrição",
      details: null,
      isError: false
    };
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Histórico de Atividades</h2>
            <p className="text-gray-600 mt-1">Acompanhe todas as ações realizadas no sistema</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(activities) && activities.length > 0 ? (
                  activities.map((activity: any) => {
                    const Icon = getActivityIcon(activity.action);
                    
                    return (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <Badge variant={getActivityColor(activity.action)}>
                              {getActionText(activity.action)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                              <span className="text-primary text-sm font-medium">
                                {activity.userName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                              </span>
                            </div>
                            <span className="text-sm font-medium">{activity.userName || 'Usuário'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const formatted = formatActivityDescription(activity);
                            return (
                              <div>
                                <p className={`font-medium ${formatted.isError ? 'text-red-600' : ''}`}>{formatted.title}</p>
                                {formatted.details && (
                                  <p className={`text-xs mt-1 ${formatted.isError ? 'text-red-500' : 'text-gray-600'}`}>{formatted.details}</p>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {activity.timestamp ? 
                            format(new Date(activity.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) 
                            : 'Data não disponível'
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      {activities === null || activities === undefined ? 'Carregando atividades...' : 'Nenhuma atividade encontrada'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
