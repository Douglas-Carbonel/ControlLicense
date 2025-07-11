import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ActivityHistory() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api", "activities"],
    // Usar o queryFn padrão que já tem renovação automática de token
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
      default:
        return action;
    }
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
                        <TableCell>{activity.description || 'Sem descrição'}</TableCell>
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
