import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Building2, Database, Settings, Code, User } from "lucide-react";
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
      qtLicencasAdicionais: 0,
      versaoSap: "",
      observacao: "",
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
        <Button className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white font-medium shadow-md transition-all duration-200">
          <Plus className="h-4 w-4 mr-2" />
          Nova Licença
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] bg-gradient-to-br from-[#f4f4f4] via-white to-[#f8f9fa] border border-[#e0e0e0] shadow-xl">
        <DialogHeader className="pb-4 border-b border-[#e0e0e0]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#0095da] to-[#313d5a] text-white shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#0c151f] flex items-center gap-2">
                Nova Licença
                <div className="px-2 py-1 bg-gradient-to-r from-[#0095da] to-[#313d5a] text-white text-xs rounded-full font-medium shadow-sm">
                  DW IT Solutions
                </div>
              </DialogTitle>
              <DialogDescription className="text-sm text-[#3a3a3c] mt-1">
                Configure os dados da nova licença do sistema
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="cliente" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-[#f4f4f4] border border-[#e0e0e0] rounded-lg p-1">
                <TabsTrigger 
                  value="cliente" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
                >
                  <User className="h-4 w-4" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger 
                  value="licenca" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
                >
                  <Code className="h-4 w-4" />
                  Licença
                </TabsTrigger>
                <TabsTrigger 
                  value="sistema" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
                >
                  <Database className="h-4 w-4" />
                  Sistema
                </TabsTrigger>
                <TabsTrigger 
                  value="config" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
                >
                  <Settings className="h-4 w-4" />
                  Config
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cliente" className="mt-6">
                <Card className="border border-[#e0e0e0] shadow-sm">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="codCliente"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#0c151f] font-medium">Código do Cliente</FormLabel>
                            <FormControl>
                              <Input placeholder="C0001" {...field} className="border-[#e0e0e0] focus:border-[#0095da]" />
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
                            <FormLabel className="text-[#0c151f] font-medium">Nome do Cliente</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da empresa" {...field} className="border-[#e0e0e0] focus:border-[#0095da]" />
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
                            <FormLabel className="text-[#0c151f] font-medium">Lista de CNPJ</FormLabel>
                            <FormControl>
                              <Input placeholder="12.345.678/0001-90" {...field} className="border-[#e0e0e0] focus:border-[#0095da]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="dadosEmpresa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#0c151f] font-medium">Dados da Empresa</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Informações da empresa..." 
                                {...field} 
                                className="border-[#e0e0e0] focus:border-[#0095da] resize-none"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="licenca" className="mt-6">
                <Card className="border border-[#e0e0e0] shadow-sm">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#0c151f] font-medium">Código</FormLabel>
                            <FormControl>
                              <Input placeholder="C0001" {...field} className="border-[#e0e0e0] focus:border-[#0095da]" />
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
                            <FormLabel className="text-[#0c151f] font-medium">Linha</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))} 
                                className="border-[#e0e0e0] focus:border-[#0095da]"
                              />
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
                            <FormLabel className="text-[#0c151f] font-medium">Quantidade de Licenças</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))} 
                                className="border-[#e0e0e0] focus:border-[#0095da]"
                              />
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
                            <FormLabel className="text-[#0c151f] font-medium">Versão SAP</FormLabel>
                            <FormControl>
                              <Input placeholder="1000230" {...field} className="border-[#e0e0e0] focus:border-[#0095da]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sistema" className="mt-6">
                <Card className="border border-[#e0e0e0] shadow-sm">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="hardwareKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#0c151f] font-medium">Hardware Key</FormLabel>
                            <FormControl>
                              <Input placeholder="E0546917180" {...field} className="border-[#e0e0e0] focus:border-[#0095da]" />
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
                            <FormLabel className="text-[#0c151f] font-medium">Install Number</FormLabel>
                            <FormControl>
                              <Input placeholder="0020798655" {...field} className="border-[#e0e0e0] focus:border-[#0095da]" />
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
                            <FormLabel className="text-[#0c151f] font-medium">System Number</FormLabel>
                            <FormControl>
                              <Input placeholder="000000000312513489" {...field} className="border-[#e0e0e0] focus:border-[#0095da]" />
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
                            <FormLabel className="text-[#0c151f] font-medium">Nome do Database</FormLabel>
                            <FormControl>
                              <Input placeholder="SBO_EMPRESA" {...field} className="border-[#e0e0e0] focus:border-[#0095da]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="config" className="mt-6">
                <Card className="border border-[#e0e0e0] shadow-sm">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="endApi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#0c151f] font-medium">Endereço da API</FormLabel>
                            <FormControl>
                              <Input placeholder="http://servidor:8090/SBO_DB/DWUAPI" {...field} className="border-[#e0e0e0] focus:border-[#0095da]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="qtLicencasAdicionais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#0c151f] font-medium">Licenças Adicionais</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                className="border-[#e0e0e0] focus:border-[#0095da]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="descDb"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#0c151f] font-medium">Descrição do Database</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Base de produção..." 
                                {...field} 
                                className="border-[#e0e0e0] focus:border-[#0095da] resize-none"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="observacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#0c151f] font-medium">Observações</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Observações adicionais..." 
                                {...field} 
                                className="border-[#e0e0e0] focus:border-[#0095da] resize-none"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-[#e0e0e0] mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="border-[#e0e0e0] text-[#3a3a3c] hover:bg-[#f4f4f4]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white font-medium shadow-md transition-all duration-200"
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
