
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Clock, CheckCircle, AlertCircle, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";

export default function Profile() {
  const { user } = useAuth();

  const { data: historico, isLoading } = useQuery({
    queryKey: ["/api/clientes-historico/my-tasks"],
    staleTime: 30 * 1000,
  });

  const { pendentes, emAndamento, concluidos } = useMemo(() => {
    if (!historico || !Array.isArray(historico)) {
      return { pendentes: [], emAndamento: [], concluidos: [] };
    }

    return {
      pendentes: historico.filter((h: any) => h.statusAtual === "PENDENTE"),
      emAndamento: historico.filter((h: any) => h.statusAtual === "EM_ANDAMENTO"),
      concluidos: historico.filter((h: any) => h.statusAtual === "CONCLUIDO"),
    };
  }, [historico]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>;
      case "EM_ANDAMENTO":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Em Andamento</Badge>;
      case "CONCLUIDO":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTipoAtualizacao = (tipo: string) => {
    const tipos: Record<string, string> = {
      ACESSO_REMOTO: "Acesso Remoto",
      PRESENCIAL: "Presencial",
      INSTALACAO: "Instalação",
      ATUALIZACAO: "Atualização",
      SUPORTE: "Suporte",
    };
    return tipos[tipo] || tipo;
  };

  const renderTable = (data: any[]) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Nenhum atendimento encontrado nesta categoria</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Ambiente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data de Acesso</TableHead>
            <TableHead>Tempo Gasto</TableHead>
            <TableHead>Chamado</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item: any) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{item.nomeCliente}</p>
                  <p className="text-xs text-gray-500">{item.codigoCliente}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{item.ambiente || "N/A"}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{getTipoAtualizacao(item.tipoAtualizacao)}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {item.dataUltimoAcesso
                      ? format(new Date(item.dataUltimoAcesso), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "N/A"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{item.tempoGasto ? `${item.tempoGasto} min` : "N/A"}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono">{item.numeroChamado || "N/A"}</span>
              </TableCell>
              <TableCell>{getStatusBadge(item.statusAtual)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meu Perfil</h1>
          <p className="text-slate-600 mt-1">Visualize seus atendimentos e organize suas tarefas</p>
        </div>
      </div>

      {/* Informações do Usuário */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Informações do Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nome</label>
              <p className="text-lg font-semibold text-slate-800">{user?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Usuário</label>
              <p className="text-lg font-semibold text-slate-800">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Perfil</label>
              <Badge variant="outline" className="mt-1">
                {user?.role === "admin" ? "Administrador" : user?.role === "support" ? "Técnico" : "Usuário"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo de Atendimentos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-900">{pendentes.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Em Andamento</p>
                <p className="text-3xl font-bold text-blue-900">{emAndamento.length}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Concluídos</p>
                <p className="text-3xl font-bold text-green-900">{concluidos.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Atendimentos */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Meus Atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pendentes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pendentes">
                Pendentes ({pendentes.length})
              </TabsTrigger>
              <TabsTrigger value="emAndamento">
                Em Andamento ({emAndamento.length})
              </TabsTrigger>
              <TabsTrigger value="concluidos">
                Concluídos ({concluidos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes" className="mt-4">
              {renderTable(pendentes)}
            </TabsContent>

            <TabsContent value="emAndamento" className="mt-4">
              {renderTable(emAndamento)}
            </TabsContent>

            <TabsContent value="concluidos" className="mt-4">
              {renderTable(concluidos)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
