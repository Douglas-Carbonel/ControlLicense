import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Search, Plus, Copy, Download } from "lucide-react";
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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado!",
        description: `${field} copiado para a área de transferência`,
      });
    });
  };

  const copyFullRow = (license: any) => {
    const rowData = [
      license.codCliente || '',
      license.linha || '',
      license.ativo ? 'Ativo' : 'Inativo',
      license.nomeCliente || '',
      license.dadosEmpresa || '',
      license.hardwareKey || '',
      license.installNumber || '',
      license.systemNumber || '',
      license.nomeDb || '',
      license.descDb || '',
      license.endApi || '',
      license.listaCpnj || '',
      license.qtLicencas || '',
      license.versaoSap || ''
    ].join('\t');
    
    navigator.clipboard.writeText(rowData).then(() => {
      toast({
        title: "Linha copiada!",
        description: "Todas as informações da licença foram copiadas",
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Licenças</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as licenças e suas informações detalhadas</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Filtrar</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
          <NewLicenseModal />
        </div>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Todas as Licenças</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Mostrando {filteredLicenses.length} de {licenses?.length || 0} licenças</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar licenças..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600 font-medium min-w-[120px]">Código do Cliente</TableHead>
                    <TableHead className="text-gray-600 font-medium">Linha</TableHead>
                    <TableHead className="text-gray-600 font-medium">Ativo</TableHead>
                    <TableHead className="text-gray-600 font-medium min-w-[200px]">Nome do Cliente</TableHead>
                    <TableHead className="text-gray-600 font-medium min-w-[150px]">Dados da Empresa</TableHead>
                    <TableHead className="text-gray-600 font-medium min-w-[200px]">Hardware Key</TableHead>
                    <TableHead className="text-gray-600 font-medium">Install Number</TableHead>
                    <TableHead className="text-gray-600 font-medium">System Number</TableHead>
                    <TableHead className="text-gray-600 font-medium">Nome DB</TableHead>
                    <TableHead className="text-gray-600 font-medium">Desc. DB</TableHead>
                    <TableHead className="text-gray-600 font-medium min-w-[150px]">End.API</TableHead>
                    <TableHead className="text-gray-600 font-medium min-w-[150px]">Lista de CNPJ</TableHead>
                    <TableHead className="text-gray-600 font-medium">Qt.Licenças</TableHead>
                    <TableHead className="text-gray-600 font-medium">Versão SAP</TableHead>
                    <TableHead className="text-gray-600 font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicenses.map((license: any) => (
                    <TableRow key={license.id} className="border-gray-200 hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm font-mono text-gray-900">{license.codCliente || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.codCliente || '', 'Código do Cliente')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900">{license.linha || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.linha || '', 'Linha')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <Badge variant={getStatusVariant(license.ativo)} className={license.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {license.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.ativo ? 'Ativo' : 'Inativo', 'Status')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900">{license.nomeCliente || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.nomeCliente || '', 'Nome do Cliente')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900">{license.dadosEmpresa || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.dadosEmpresa || '', 'Dados da Empresa')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm font-mono text-gray-900 truncate">{license.hardwareKey || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.hardwareKey || '', 'Hardware Key')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900">{license.installNumber || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.installNumber || '', 'Install Number')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900">{license.systemNumber || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.systemNumber || '', 'System Number')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900">{license.nomeDb || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.nomeDb || '', 'Nome DB')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900">{license.descDb || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.descDb || '', 'Desc. DB')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900 truncate">{license.endApi || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.endApi || '', 'End.API')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900">{license.listaCpnj || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.listaCpnj || '', 'Lista de CNPJ')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm font-medium text-gray-900">{license.qtLicencas || '0'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.qtLicencas?.toString() || '0', 'Qt.Licenças')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900">{license.versaoSap || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                            onClick={() => copyToClipboard(license.versaoSap || '', 'Versão SAP')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => copyFullRow(license)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(license.id)}
                            disabled={deleteMutation.isPending}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}