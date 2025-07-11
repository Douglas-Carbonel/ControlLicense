
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
      license.listaCnpj || '',
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
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="w-full">
              <div className="overflow-auto max-h-[70vh] border rounded-lg" style={{ maxWidth: '100vw' }}>
                <table className="w-full border-collapse bg-white" style={{ minWidth: '2000px' }}>
                  <thead className="sticky top-0 z-20 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="sticky left-0 z-30 bg-gray-50 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 min-w-[120px]">
                        Código Cliente
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-16">
                        Linha
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-20">
                        Ativo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[180px]">
                        Nome do Cliente
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[150px]">
                        Dados Empresa
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[160px]">
                        Hardware Key
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[120px]">
                        Install Number
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[120px]">
                        System Number
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[120px]">
                        Nome DB
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[120px]">
                        Desc. DB
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[140px]">
                        End. API
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[130px]">
                        Lista CNPJ
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-20">
                        Qt.Lic.
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[100px]">
                        Versão SAP
                      </th>
                      <th className="sticky right-0 z-30 bg-gray-50 px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-300 w-24">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLicenses.map((license: any, index: number) => (
                      <tr key={license.id} className={`hover:bg-gray-50/80 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        {/* Código do Cliente - Sticky */}
                        <td className="sticky left-0 z-20 bg-inherit px-4 py-3 border-r border-gray-300">
                          <div className="flex items-center group">
                            <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                              {license.codCliente || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6"
                              onClick={() => copyToClipboard(license.codCliente || '', 'Código do Cliente')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Linha */}
                        <td className="px-3 py-3 text-center border-r border-gray-200">
                          <div className="flex items-center justify-center group">
                            <span className="text-sm font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded-full">
                              {license.linha || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6"
                              onClick={() => copyToClipboard(license.linha || '', 'Linha')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center border-r border-gray-200">
                          <div className="flex items-center justify-center group">
                            <Badge 
                              variant={getStatusVariant(license.ativo)} 
                              className={`${license.ativo ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"} text-xs font-medium px-2 py-1`}
                            >
                              {license.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6"
                              onClick={() => copyToClipboard(license.ativo ? 'Ativo' : 'Inativo', 'Status')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Nome do Cliente */}
                        <td className="px-4 py-3 border-r border-gray-200">
                          <div className="flex items-center group">
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]" title={license.nomeCliente || 'N/A'}>
                              {license.nomeCliente || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6 flex-shrink-0"
                              onClick={() => copyToClipboard(license.nomeCliente || '', 'Nome do Cliente')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Dados da Empresa */}
                        <td className="px-3 py-3 border-r border-gray-200">
                          <div className="flex items-center group">
                            <span className="text-xs text-gray-600 truncate max-w-[130px]" title={license.dadosEmpresa || 'N/A'}>
                              {license.dadosEmpresa || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6 flex-shrink-0"
                              onClick={() => copyToClipboard(license.dadosEmpresa || '', 'Dados da Empresa')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Hardware Key */}
                        <td className="px-3 py-3 border-r border-gray-200">
                          <div className="flex items-center group">
                            <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded border truncate max-w-[140px]" title={license.hardwareKey || 'N/A'}>
                              {license.hardwareKey || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6 flex-shrink-0"
                              onClick={() => copyToClipboard(license.hardwareKey || '', 'Hardware Key')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Install Number */}
                        <td className="px-3 py-3 border-r border-gray-200">
                          <div className="flex items-center group">
                            <span className="text-xs font-mono text-gray-600">
                              {license.installNumber || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6 flex-shrink-0"
                              onClick={() => copyToClipboard(license.installNumber || '', 'Install Number')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* System Number */}
                        <td className="px-3 py-3 border-r border-gray-200">
                          <div className="flex items-center group">
                            <span className="text-xs font-mono text-gray-600">
                              {license.systemNumber || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6 flex-shrink-0"
                              onClick={() => copyToClipboard(license.systemNumber || '', 'System Number')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Nome DB */}
                        <td className="px-3 py-3 border-r border-gray-200">
                          <div className="flex items-center group">
                            <span className="text-xs text-gray-600 truncate max-w-[100px]" title={license.nomeDb || 'N/A'}>
                              {license.nomeDb || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6 flex-shrink-0"
                              onClick={() => copyToClipboard(license.nomeDb || '', 'Nome DB')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Desc. DB */}
                        <td className="px-3 py-3 border-r border-gray-200">
                          <div className="flex items-center group">
                            <span className="text-xs text-gray-600 truncate max-w-[100px]" title={license.descDb || 'N/A'}>
                              {license.descDb || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6 flex-shrink-0"
                              onClick={() => copyToClipboard(license.descDb || '', 'Desc. DB')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* End. API */}
                        <td className="px-3 py-3 border-r border-gray-200">
                          <div className="flex items-center group">
                            <span className="text-xs text-gray-600 truncate max-w-[120px]" title={license.endApi || 'N/A'}>
                              {license.endApi || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6 flex-shrink-0"
                              onClick={() => copyToClipboard(license.endApi || '', 'End.API')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Lista de CNPJ */}
                        <td className="px-3 py-3 border-r border-gray-200">
                          <div className="flex items-center group">
                            <span className="text-xs font-mono text-gray-600 truncate max-w-[110px]" title={license.listaCnpj || 'N/A'}>
                              {license.listaCnpj || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6 flex-shrink-0"
                              onClick={() => copyToClipboard(license.listaCnpj || '', 'Lista de CNPJ')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Quantidade de Licenças */}
                        <td className="px-3 py-3 text-center border-r border-gray-200">
                          <div className="flex items-center justify-center group">
                            <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                              {license.qtLicencas || '0'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6"
                              onClick={() => copyToClipboard(license.qtLicencas?.toString() || '0', 'Qt.Licenças')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Versão SAP */}
                        <td className="px-3 py-3 border-r border-gray-200">
                          <div className="flex items-center group">
                            <span className="text-xs text-gray-600">
                              {license.versaoSap || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-1 p-1 h-6 w-6 flex-shrink-0"
                              onClick={() => copyToClipboard(license.versaoSap || '', 'Versão SAP')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        {/* Ações - Sticky */}
                        <td className="sticky right-0 z-20 bg-inherit px-3 py-3 border-l border-gray-300">
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 h-8 w-8"
                              onClick={() => copyFullRow(license)}
                              title="Copiar linha completa"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 h-8 w-8"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(license.id)}
                              disabled={deleteMutation.isPending}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 h-8 w-8"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredLicenses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma licença encontrada.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
