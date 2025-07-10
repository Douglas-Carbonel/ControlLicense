import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImportModal() {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Licenças</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Arquivo selecionado:</p>
              <p className="text-sm text-gray-600">{file.name}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || importMutation.isPending}
            >
              {importMutation.isPending ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
