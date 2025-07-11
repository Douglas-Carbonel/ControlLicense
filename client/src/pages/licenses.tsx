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
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm" style={{maxWidth: '100vw'}}>
              <Table className="w-full table-fixed" style={{minWidth: '1800px'}}>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50">
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[100px] sticky left-0 bg-gray-50 z-10 border-r">
                      Cód. Cliente
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[60px] text-center">
                      Linha
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[80px] text-center">
                      Status
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[180px]">
                      Nome do Cliente
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[150px]">
                      Dados da Empresa
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[180px]">
                      Hardware Key
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[120px]">
                      Install Number
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[120px]">
                      System Number
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[120px]">
                      Nome DB
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[120px]">
                      Desc. DB
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[160px]">
                      End. API
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[140px]">
                      Lista de CNPJ
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[80px] text-center">
                      Qt. Lic.
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[100px]">
                      Versão SAP
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wide w-[100px] sticky right-0 bg-gray-50 z-10 border-l text-center">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicenses.map((license: any) => (
                    <TableRow key={license.id} className="border-gray-200 hover:bg-gray-50/50 transition-colors">
                      {/* Código do Cliente - Sticky */}
                      <TableCell className="sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 border-r border-gray-200">
                        <div className="flex items-center justify-between group">
                          <span className="text-sm font-mono font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {license.codCliente || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.codCliente || '', 'Código do Cliente')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Linha */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center group">
                          <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                            {license.linha || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.linha || '', 'Linha')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex items-center group">
                          <Badge 
                            variant={getStatusVariant(license.ativo)} 
                            className={`${license.ativo ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"} text-xs font-medium px-2 py-1`}
                          >
                            {license.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.ativo ? 'Ativo' : 'Inativo', 'Status')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Nome do Cliente */}
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-900 font-medium truncate">
                            {license.nomeCliente || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.nomeCliente || '', 'Nome do Cliente')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Quantidade de Licenças */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center group">
                          <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {license.qtLicencas || '0'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.qtLicencas?.toString() || '0', 'Qt.Licenças')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Dados da Empresa */}
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-600 truncate">
                            {license.dadosEmpresa || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.dadosEmpresa || '', 'Dados da Empresa')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Hardware Key */}
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded border truncate max-w-[150px]">
                            {license.hardwareKey || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.hardwareKey || '', 'Hardware Key')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Install Number */}
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-600 font-mono">
                            {license.installNumber || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.installNumber || '', 'Install Number')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* System Number */}
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-600 font-mono">
                            {license.systemNumber || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.systemNumber || '', 'System Number')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Nome DB */}
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-600">
                            {license.nomeDb || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.nomeDb || '', 'Nome DB')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Desc. DB */}
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-600">
                            {license.descDb || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.descDb || '', 'Desc. DB')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* End. API */}
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-600 truncate max-w-[140px]">
                            {license.endApi || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.endApi || '', 'End.API')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Lista de CNPJ */}
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-600 font-mono">
                            {license.listaCnpj || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.listaCnpj || '', 'Lista de CNPJ')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Versão SAP */}
                      <TableCell>
                        <div className="flex items-center justify-between group">
                          <span className="text-sm text-gray-600">
                            {license.versaoSap || 'N/A'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 ml-1"
                            onClick={() => copyToClipboard(license.versaoSap || '', 'Versão SAP')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Ações - Sticky */}
                      <TableCell className="sticky right-0 bg-white group-hover:bg-gray-50/50 z-10 border-l border-gray-200">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => copyFullRow(license)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(license.id)}
                            disabled={deleteMutation.isPending}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
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