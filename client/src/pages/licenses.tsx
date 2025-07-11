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
            <div className="w-full relative">
              <div className="overflow-auto max-h-[70vh] border rounded-lg license-table-container" style={{ maxWidth: '100vw' }}>
                <table className="w-full" style={{ minWidth: '2000px' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Código Cliente
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ minWidth: '180px' }}>
                        Nome do Cliente
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                        Dados Empresa
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ minWidth: '160px' }}>
                        Hardware Key
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                        Install Number
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                        System Number
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                        Nome DB
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                        Desc. DB
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ minWidth: '140px' }}>
                        End. API
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ minWidth: '130px' }}>
                        Lista CNPJ
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ width: '80px' }}>
                        Qt.Lic.
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                        Versão SAP
                      </th>
                      <th className="sticky right-0 z-20 bg-gray-50 px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-l border-gray-200" style={{ width: '100px' }}>
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredLicenses.map((license: any, index: number) => (
                      <tr key={license.id} className="hover:bg-gray-50 transition-colors duration-150">
                        {/* Código do Cliente - Sticky */}
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 hover:bg-gray-50">
                          <div className="flex items-center group">
                            <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-semibold">
                              {license.codCliente || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-blue-100"
                              onClick={() => copyToClipboard(license.codCliente || '', 'Código do Cliente')}
                            >
                              <Copy className="w-3 h-3 text-blue-600" />
                            </Button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              license.ativo 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {license.ativo ? "Ativo" : "Inativo"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.ativo ? 'Ativo' : 'Inativo', 'Status')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* Nome do Cliente */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className="text-gray-900 font-medium truncate max-w-[160px]" title={license.nomeCliente || 'N/A'}>
                              {license.nomeCliente || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.nomeCliente || '', 'Nome do Cliente')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* Dados da Empresa */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className="text-gray-600 truncate max-w-[130px]" title={license.dadosEmpresa || 'N/A'}>
                              {license.dadosEmpresa || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.dadosEmpresa || '', 'Dados da Empresa')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* Hardware Key */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className="font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded text-xs truncate max-w-[140px]" title={license.hardwareKey || 'N/A'}>
                              {license.hardwareKey || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.hardwareKey || '', 'Hardware Key')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* Install Number */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className="font-mono text-gray-600 text-xs">
                              {license.installNumber || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.installNumber || '', 'Install Number')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* System Number */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className="font-mono text-gray-600 text-xs">
                              {license.systemNumber || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.systemNumber || '', 'System Number')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* Nome DB */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className="text-gray-600 truncate max-w-[100px]" title={license.nomeDb || 'N/A'}>
                              {license.nomeDb || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.nomeDb || '', 'Nome DB')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* Desc. DB */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className="text-gray-600 truncate max-w-[100px]" title={license.descDb || 'N/A'}>
                              {license.descDb || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.descDb || '', 'Desc. DB')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* End. API */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className="text-gray-600 truncate max-w-[120px]" title={license.endApi || 'N/A'}>
                              {license.endApi || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.endApi || '', 'End.API')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* Lista de CNPJ */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className="font-mono text-gray-600 text-xs truncate max-w-[110px]" title={license.listaCnpj || 'N/A'}>
                              {license.listaCnpj || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.listaCnpj || '', 'Lista de CNPJ')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* Quantidade de Licenças */}
                        <td className="px-3 py-3 text-sm text-center">
                          <div className="flex items-center justify-center group">
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {license.qtLicencas || '0'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.qtLicencas?.toString() || '0', 'Qt.Licenças')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* Versão SAP */}
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center group">
                            <span className="text-gray-600">
                              {license.versaoSap || 'N/A'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
                              onClick={() => copyToClipboard(license.versaoSap || '', 'Versão SAP')}
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </td>

                        {/* Ações - Sticky */}
                        <td className="sticky right-0 z-10 bg-white px-3 py-3 text-center border-l border-gray-200 hover:bg-gray-50">
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-7 w-7 hover:bg-blue-50 text-blue-600"
                              onClick={() => copyFullRow(license)}
                              title="Copiar linha completa"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-1 h-7 w-7 hover:bg-gray-100 text-gray-500"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(license.id)}
                              disabled={deleteMutation.isPending}
                              className="p-1 h-7 w-7 hover:bg-red-50 text-gray-500 hover:text-red-600"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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