import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RecentLicensesTable() {
  const { data: licenses, isLoading } = useQuery({
    queryKey: ["/api/licenses"],
  });

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Licenças Recentes</CardTitle>
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

  const recentLicenses = licenses?.slice(0, 5) || [];

  const getStatusVariant = (ativo: boolean) => {
    return ativo ? "default" : "secondary";
  };

  const getStatusText = (ativo: boolean) => {
    return ativo ? "Ativa" : "Inativa";
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Licenses</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Latest license registrations</p>
          </div>
          <Button variant="outline" size="sm">
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-600 font-medium">NOME DO CLIENTE</TableHead>
              <TableHead className="text-gray-600 font-medium">HARDWARE KEY</TableHead>
              <TableHead className="text-gray-600 font-medium">STATUS</TableHead>
              <TableHead className="text-gray-600 font-medium">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentLicenses.map((license: any) => (
              <TableRow key={license.id} className="border-gray-200">
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-gray-600 text-sm font-medium">
                        {license.nomeCliente?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || license.codCliente?.slice(0, 2) || "??"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{license.nomeCliente || 'Nome não informado'}</div>
                      <div className="text-xs text-gray-500">
                        ID: {license.codCliente || 'Código não informado'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600 font-mono">{license.hardwareKey || 'N/A'}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(license.ativo)} className={license.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {license.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}