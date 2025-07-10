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
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Licenças Recentes</CardTitle>
          <Button variant="ghost" size="sm">
            Ver todas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Hardware Key</TableHead>
              <TableHead>Database</TableHead>
              <TableHead>Qt. Licenças</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentLicenses.map((license: any) => (
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
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
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
