import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export default function RecentLicensesTable() {
  const { data: licenses, isLoading, error } = useQuery({
    queryKey: ["/api/licenses?limit=5"],
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  const getStatusVariant = (ativo: boolean) => {
    return ativo ? "default" : "secondary";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Erro ao carregar licenças recentes</p>
      </div>
    );
  }

  // Safety check for licenses data
  const licensesList = licenses?.data || [];
  const recentLicenses = Array.isArray(licensesList) ? licensesList.slice(0, 5) : [];

  if (recentLicenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma licença encontrada</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-200">
          <TableHead className="text-slate-600 font-medium">Cliente</TableHead>
          <TableHead className="text-slate-600 font-medium">Hardware Key</TableHead>
          <TableHead className="text-slate-600 font-medium">Status</TableHead>
          <TableHead className="text-slate-600 font-medium w-20">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentLicenses.map((license: any) => (
          <TableRow key={license.id} className="border-gray-100 hover:bg-slate-50/50">
            <TableCell>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 text-sm font-medium">
                    {license.nomeCliente?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || license.codCliente?.slice(0, 2) || "??"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{license.nomeCliente || 'Nome não informado'}</div>
                  <div className="text-xs text-slate-500">
                    ID: {license.codCliente || 'Código não informado'}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm text-slate-600 font-mono">{license.hardwareKey || 'N/A'}</div>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(license.ativo)} className={license.ativo ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                {license.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}