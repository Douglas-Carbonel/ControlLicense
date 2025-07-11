import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { insertLicenseSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertLicenseSchema;

export default function NewLicenseModal() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      linha: 1,
      ativo: true,
      codCliente: "",
      nomeCliente: "",
      dadosEmpresa: "",
      hardwareKey: "",
      installNumber: "",
      systemNumber: "",
      nomeDb: "",
      descDb: "",
      endApi: "",
      listaCnpj: "",
      qtLicencas: 1,
      versaoSap: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/licenses", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidar queries de forma mais eficiente
      queryClient.invalidateQueries({ 
        queryKey: ["/api", "licenses"],
        refetchType: 'active' // Só refetch se a query estiver ativa
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api", "licenses", "stats"],
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api", "activities"],
        refetchType: 'active'
      });
      toast({
        title: "Sucesso",
        description: "Licença criada com sucesso!",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Erro ao criar licença:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar licença. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Licença
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[600px] bg-white border border-[#e0e0e0] shadow-lg"
        description="Preencha os dados para criar uma nova licença"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#3a3a3c]">Nova Licença</DialogTitle>
          <p id="dialog-description" className="text-sm text-[#3a3a3c] mt-2">Preencha os dados para criar uma nova licença</p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="C0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linha</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codCliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="C0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nomeCliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hardwareKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hardware Key</FormLabel>
                    <FormControl>
                      <Input placeholder="E0546917180" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="installNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Install Number</FormLabel>
                    <FormControl>
                      <Input placeholder="0020798655" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="systemNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Number</FormLabel>
                    <FormControl>
                      <Input placeholder="000000000312513489" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nomeDb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Database</FormLabel>
                    <FormControl>
                      <Input placeholder="SBO_EMPRESA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="listaCnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lista de CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="12.345.678/0001-90" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qtLicencas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Licenças</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dadosEmpresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dados da Empresa</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Informações da empresa..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descDb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Database</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Base de produção..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="endApi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço da API</FormLabel>
                    <FormControl>
                      <Input placeholder="http://servidor:8090/SBO_DB/DWUAPI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="versaoSap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão SAP</FormLabel>
                    <FormControl>
                      <Input placeholder="1000230" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-[#e0e0e0]">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Criando..." : "Criar Licença"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
