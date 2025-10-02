
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Edit, Upload, Trash2, Globe, Shield, Activity, Filter, Search, Calendar as CalendarIcon, X, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

const ITEMS_PER_PAGE = 50;

export default function ActivityHistory() {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedMenu, setSelectedMenu] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ["/api/activities"],
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });

  // Mutation para marcar atividades como lidas
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/activities/mark-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities/unread-count'] });
    },
  });

  useEffect(() => {
    markAsReadMutation.mutate();

    const handleFocus = () => {
      markAsReadMutation.mutate();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUser, selectedMenu, dateFrom, dateTo]);

  const filteredActivities = useMemo(() => {
    if (!activities) return [];

    let filtered = activities;

    // Filtro por menu/recurso
    if (selectedMenu && selectedMenu !== "all") {
      filtered = filtered.filter((activity: any) => 
        activity.resourceType === selectedMenu
      );
    }

    // Filtro por usuário
    if (selectedUser && selectedUser !== "all") {
      filtered = filtered.filter((activity: any) => 
        activity.userName === selectedUser
      );
    }

    // Filtro por data
    if (dateFrom) {
      filtered = filtered.filter((activity: any) => 
        new Date(activity.timestamp) >= dateFrom
      );
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter((activity: any) => 
        new Date(activity.timestamp) <= endOfDay
      );
    }

    return filtered;
  }, [activities, selectedUser, selectedMenu, dateFrom, dateTo]);

  // Paginação
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredActivities.slice(start, end);
  }, [filteredActivities, currentPage]);

  // Extrair usuários únicos
  const uniqueUsers = useMemo(() => {
    if (!activities) return [];
    const users = [...new Set(activities.map((activity: any) => activity.userName))];
    return users.filter(Boolean).sort();
  }, [activities]);

  // Extrair menus/recursos únicos
  const uniqueMenus = useMemo(() => {
    if (!activities) return [];
    const menus = [...new Set(activities.map((activity: any) => activity.resourceType))];
    return menus.filter(Boolean).sort();
  }, [activities]);

  const clearFilters = () => {
    setSelectedUser("all");
    setSelectedMenu("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = (selectedUser && selectedUser !== "all") || (selectedMenu && selectedMenu !== "all") || dateFrom || dateTo;

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "CREATE":
      case "CLIENT_HISTORY_CREATE":
        return Plus;
      case "UPDATE":
      case "CLIENT_HISTORY_UPDATE":
        return Edit;
      case "DELETE":
      case "CLIENT_HISTORY_DELETE":
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
      case "CLIENT_HISTORY_CREATE":
        return "default";
      case "UPDATE":
      case "CLIENT_HISTORY_UPDATE":
        return "secondary";
      case "DELETE":
      case "CLIENT_HISTORY_DELETE":
        return "outline";
      case "IMPORT":
        return "default";
      case "QUERY":
        return "secondary";
      case "QUERY_ENCRYPTED":
        return "outline";
      case "LOGIN":
        return "default";
      case "LOGOUT":
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
      case "LOGIN":
        return "Login";
      case "LOGOUT":
        return "Logout";
      case "LICENSE_CREATE":
        return "Criação de Licença";
      case "LICENSE_UPDATE":
        return "Atualização de Licença";
      case "LICENSE_DELETE":
        return "Exclusão de Licença";
      case "CLIENT_HISTORY_CREATE":
        return "Novo Registro Cliente";
      case "CLIENT_HISTORY_UPDATE":
        return "Atualização Cliente";
      case "CLIENT_HISTORY_DELETE":
        return "Exclusão Registro Cliente";
      case "MESSAGE_SEND":
        return "Envio de Mensagem";
      case "USER_CREATE":
        return "Criação de Usuário";
      case "USER_UPDATE":
        return "Atualização de Usuário";
      case "USER_DELETE":
        return "Exclusão de Usuário";
      case "ERROR":
        return "Erro Registrado";
      default:
        return action;
    }
  };

  const getMenuText = (menu: string) => {
    switch (menu) {
      case "license":
        return "Licenças";
      case "cliente_historico":
        return "Histórico de Clientes";
      case "mensagem":
        return "Mensagens";
      case "user":
        return "Usuários";
      default:
        return menu;
    }
  };

  const formatActivityDescription = (activity: any) => {
    if (activity.action === "QUERY" || activity.action === "QUERY_ENCRYPTED") {
      const description = activity.description || "";

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
      isError: activity.description?.includes("(ERRO)") || activity.description?.includes("ERROR") || false
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Logs do Sistema</h1>
          <p className="text-slate-600 mt-1">Monitore todas as ações e consultas realizadas no sistema</p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros Simplificados */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg font-semibold text-slate-800">Filtros</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filtro por menu/recurso */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Menu</label>
              <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os menus</SelectItem>
                  {uniqueMenus.map((menu) => (
                    <SelectItem key={menu} value={menu}>{getMenuText(menu)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por usuário */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Usuário</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Total</label>
              <div className="h-10 flex items-center justify-center bg-slate-50 border rounded-md px-3">
                <span className="text-sm font-semibold text-slate-700">{filteredActivities?.length || 0} registros</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg font-semibold text-slate-800">Registros de Atividades</CardTitle>
            </div>
            <Badge variant="outline" className="text-sm">
              {filteredActivities?.length || 0} registros encontrados
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Ação</TableHead>
                    <TableHead className="w-[180px]">Usuário</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(paginatedActivities) && paginatedActivities.length > 0 ? (
                    paginatedActivities.map((activity: any) => {
                      const Icon = getActivityIcon(activity.action);
                      const formatted = formatActivityDescription(activity);

                      return (
                        <TableRow key={activity.id} className={formatted.isError ? "bg-red-50" : ""}>
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
                            <div>
                              <p className={`font-medium ${formatted.isError ? 'text-red-600' : ''}`}>
                                {formatted.title}
                              </p>
                              {formatted.details && (
                                <p className={`text-xs mt-1 ${formatted.isError ? 'text-red-500' : 'text-gray-600'}`}>
                                  {formatted.details}
                                </p>
                              )}
                            </div>
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
                        {hasActiveFilters ? 'Nenhuma atividade encontrada com os filtros aplicados' : 
                         (activities === null || activities === undefined ? 'Carregando atividades...' : 'Nenhuma atividade encontrada')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Paginação */}
              {filteredActivities.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredActivities.length)} de {filteredActivities.length} registros
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <div className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
