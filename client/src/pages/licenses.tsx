import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Search, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import NewLicenseModal from "@/components/modals/new-license-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Licenses() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: licenses, isLoading } = useQuery({
    queryKey: ["/api/licenses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/licenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Licença excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir licença. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const getStatusVariant = (ativo: boolean) => {
    return ativo ? "default" : "secondary";
  };

  const getStatusText = (ativo: boolean) => {
    return ativo ? "Ativa" : "Inativa";
  };

  const filteredLicenses = licenses?.filter((license: any) =>
    license.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.codCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.hardwareKey?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta licença?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Licenças</h2>
            <p className="text-gray-600 mt-1">Gerencie todas as licenças do sistema</p>
          </div>
          <NewLicenseModal />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Todas as Licenças</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar licenças..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Código da Licença</TableHead>
                  <TableHead className="font-semibold">Hardware Key / Install</TableHead>
                  <TableHead className="font-semibold">Database / API</TableHead>
                  <TableHead className="font-semibold text-center">Quantidade</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license: any) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                          <span className="text-white text-sm font-semibold">
                            {license.nomeCliente?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || license.codCliente?.slice(0, 2) || "??"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 mb-1">{license.nomeCliente || 'Nome não informado'}</div>
                          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md inline-block font-mono">
                            {license.codCliente || 'Código não informado'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                        {license.code || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded border">
                          {license.hardwareKey || 'Não informado'}
                        </div>
                        {license.installNumber && (
                          <div className="text-xs text-gray-500">
                            Install: <span className="font-mono">{license.installNumber}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">{license.nomeDb || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{license.descDb || 'Descrição não informada'}</div>
                        {license.endApi && (
                          <div className="text-xs text-blue-600 font-mono truncate max-w-32" title={license.endApi}>
                            {license.endApi}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{license.qtLicencas || 0}</div>
                        <div className="text-xs text-gray-500">licenças</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(license.ativo)} className="font-medium">
                        {getStatusText(license.ativo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(license.id)}
                          disabled={deleteMutation.isPending}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
