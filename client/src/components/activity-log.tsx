import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ActivityLog() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
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
      default:
        return Plus;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-primary";
      case "UPDATE":
        return "bg-yellow-500";
      case "DELETE":
        return "bg-red-500";
      case "IMPORT":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-mb-8">
            {activities?.map((activity: any, index: number) => {
              const Icon = getActivityIcon(activity.action);
              const isLast = index === activities.length - 1;
              
              return (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getActivityColor(activity.action)}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(activity.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
