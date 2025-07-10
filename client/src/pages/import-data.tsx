import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudUpload, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImportData() {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to import file");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: data.message,
      });
      setFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao importar arquivo. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = () => {
    if (file) {
      importMutation.mutate(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importar Dados</h2>
            <p className="text-gray-600 mt-1">Importe licenças em lote através de planilhas</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Baixar Modelo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Arraste e solte seu arquivo aqui ou</p>
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button asChild variant="outline">
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-2">Suporta: .xlsx, .csv (máx. 10MB)</p>
            </div>
            
            {file && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setFile(null)}
                disabled={!file}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!file || importMutation.isPending}
              >
                {importMutation.isPending ? "Importando..." : "Importar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Formatos Suportados</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Planilhas Excel (.xlsx)</li>
                  <li>• Arquivos CSV (.csv)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Colunas Obrigatórias</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>clientName</strong> - Nome do cliente</li>
                  <li>• <strong>clientEmail</strong> - Email do cliente</li>
                  <li>• <strong>licenseType</strong> - Tipo da licença</li>
                  <li>• <strong>issueDate</strong> - Data de emissão</li>
                  <li>• <strong>expirationDate</strong> - Data de vencimento</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Colunas Opcionais</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>status</strong> - Status da licença</li>
                  <li>• <strong>notes</strong> - Observações</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Dica:</strong> Baixe o modelo de planilha para garantir que os dados estejam no formato correto.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
