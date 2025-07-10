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
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Hardware Key</TableHead>
                  <TableHead>Database</TableHead>
                  <TableHead>Qt. Licenças</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license: any) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <span className="text-primary text-sm font-medium">
                            {license.nomeCliente?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || license.codCliente?.slice(0, 2) || "??"}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{license.nomeCliente}</div>
                          <div className="text-sm text-gray-500">{license.codCliente}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{license.code}</TableCell>
                    <TableCell>{license.hardwareKey}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{license.nomeDb}</div>
                        <div className="text-sm text-gray-500">{license.descDb}</div>
                      </div>
                    </TableCell>
                    <TableCell>{license.qtLicencas}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(license.ativo)}>
                        {getStatusText(license.ativo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(license.id)}
                          disabled={deleteMutation.isPending}
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
