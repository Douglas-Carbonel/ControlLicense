import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle, AlertTriangle, Clock, XCircle, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function FormularioPublico() {
  const [match, params] = useRoute("/formulario-publico/:url");
  const [location, setLocation] = useLocation();
  const url = params?.url;
  const { toast } = useToast();
  const [formulario, setFormulario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nomeContato: "",
    emailContato: "",
    telefoneContato: "",
    empresa: "",
    observacoes: "",
    respostas: {} as Record<string, string>
  });

  useEffect(() => {
    const fetchFormulario = async () => {
      try {
        const response = await fetch(`/api/formulario-publico/${url}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Formulário não encontrado");
          return;
        }

        setFormulario(data);

        // Inicializar respostas vazias
        const campos = JSON.parse(data.campos || "[]");
        const respostasIniciais: Record<string, string> = {};
        campos.forEach((campo: any) => {
          respostasIniciais[campo.id] = "";
        });
        setFormData(prev => ({ ...prev, respostas: respostasIniciais }));

      } catch (error) {
        console.error("Erro ao carregar formulário:", error);
        setError("Erro ao carregar formulário");
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchFormulario();
    }
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/formulario-publico/${url}/resposta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          respostas: JSON.stringify(formData.respostas)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao enviar formulário");
      }

      setSubmitted(true);
      toast({
        title: "Sucesso!",
        description: "Formulário enviado com sucesso. Entraremos em contato em breve.",
      });

    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao enviar formulário. Tente novamente.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateResposta = (campoId: string, valor: string) => {
    setFormData(prev => ({
      ...prev,
      respostas: {
        ...prev.respostas,
        [campoId]: valor
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f4f4f4] via-white to-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0095da] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f4f4f4] via-white to-[#f8f9fa] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Formulário Não Disponível</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f4f4f4] via-white to-[#f8f9fa] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Formulário Enviado!</h2>
            <p className="text-gray-600 mb-4">
              Obrigado por preencher o formulário. Nossa equipe entrará em contato em breve para dar continuidade ao processo.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-green-800">
                <strong>Próximos passos:</strong><br />
                • Análise das informações fornecidas<br />
                • Contato da nossa equipe técnica<br />
                • Agendamento da instalação
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const campos = JSON.parse(formulario?.campos || "[]");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f4f4] via-white to-[#f8f9fa] py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-xl border border-[#e0e0e0]">
          <CardHeader className="bg-gradient-to-r from-[#0095da] to-[#313d5a] text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/20">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  {formulario?.titulo}
                </CardTitle>
                <p className="text-blue-100 mt-1">
                  DW IT Solutions - Onboarding de Cliente
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">Cliente: {formulario?.nomeCliente}</h3>
                {formulario?.descricao && (
                  <p className="text-blue-800 text-sm mb-2">{formulario.descricao}</p>
                )}
                {formulario?.dataExpiracao && (
                  <p className="text-blue-700 text-sm flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Prazo para preenchimento: {format(new Date(formulario.dataExpiracao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>

              {formulario?.premissas && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Informações Importantes
                  </h4>
                  <div className="text-yellow-800 text-sm whitespace-pre-wrap">
                    {formulario.premissas}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados de Contato */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Dados de Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomeContato">Nome do Contato *</Label>
                    <Input
                      id="nomeContato"
                      value={formData.nomeContato}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomeContato: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailContato">Email *</Label>
                    <Input
                      id="emailContato"
                      type="email"
                      value={formData.emailContato}
                      onChange={(e) => setFormData(prev => ({ ...prev, emailContato: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefoneContato">Telefone</Label>
                    <Input
                      id="telefoneContato"
                      type="tel"
                      value={formData.telefoneContato}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefoneContato: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="empresa">Empresa *</Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Campos Dinâmicos */}
              {campos.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Informações Específicas</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {campos.map((campo: any) => (
                      <div key={campo.id}>
                        <Label htmlFor={campo.id}>
                          {campo.label} {campo.obrigatorio && "*"}
                        </Label>
                        {campo.tipo === "textarea" ? (
                          <Textarea
                            id={campo.id}
                            value={formData.respostas[campo.id] || ""}
                            onChange={(e) => updateResposta(campo.id, e.target.value)}
                            required={campo.obrigatorio}
                            className="mt-1"
                            rows={3}
                          />
                        ) : (
                          <Input
                            id={campo.id}
                            type={campo.tipo || "text"}
                            value={formData.respostas[campo.id] || ""}
                            onChange={(e) => updateResposta(campo.id, e.target.value)}
                            required={campo.obrigatorio}
                            className="mt-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações de Licença */}
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold text-blue-900">📋 Informações de Licença SAP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hardware_key" className="text-sm font-medium">Chave de Hardware (Hardware Key) *</Label>
                  <Input
                    id="hardware_key"
                    name="hardware_key"
                    value={formData.respostas.hardware_key || ''}
                    onChange={(e) => updateResposta('hardware_key', e.target.value)}
                    required
                    placeholder="Ex: A1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="install_number" className="text-sm font-medium">Número de Instalação *</Label>
                  <Input
                    id="install_number"
                    name="install_number"
                    value={formData.respostas.install_number || ''}
                    onChange={(e) => updateResposta('install_number', e.target.value)}
                    required
                    placeholder="Ex: 123456"
                  />
                </div>
                <div>
                  <Label htmlFor="system_number" className="text-sm font-medium">Número do Sistema *</Label>
                  <Input
                    id="system_number"
                    name="system_number"
                    value={formData.respostas.system_number || ''}
                    onChange={(e) => updateResposta('system_number', e.target.value)}
                    required
                    placeholder="Ex: 000000000123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="nome_base_producao" className="text-sm font-medium">Nome da Base de Produção *</Label>
                  <Input
                    id="nome_base_producao"
                    name="nome_base_producao"
                    value={formData.respostas.nome_base_producao || ''}
                    onChange={(e) => updateResposta('nome_base_producao', e.target.value)}
                    required
                    placeholder="Ex: SBO_EMPRESA_PRD"
                  />
                </div>
                <div>
                  <Label htmlFor="nome_base_teste" className="text-sm font-medium">Nome da Base de Teste/Homologação</Label>
                  <Input
                    id="nome_base_teste"
                    name="nome_base_teste"
                    value={formData.respostas.nome_base_teste || ''}
                    onChange={(e) => updateResposta('nome_base_teste', e.target.value)}
                    placeholder="Ex: SBO_EMPRESA_TST"
                  />
                </div>
              </div>
            </div>

            {/* Configurações de Servidor */}
            <div className="space-y-4 p-4 border rounded-lg bg-green-50">
              <h3 className="font-semibold text-green-900">🖥️ Configurações do Servidor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="servidor_web_ip" className="text-sm font-medium">IP/Servidor WEB</Label>
                  <Input
                    id="servidor_web_ip"
                    name="servidor_web_ip"
                    value={formData.respostas.servidor_web_ip || ''}
                    onChange={(e) => updateResposta('servidor_web_ip', e.target.value)}
                    placeholder="Ex: 192.168.1.100"
                  />
                </div>
                <div>
                  <Label htmlFor="possui_hana" className="text-sm font-medium">Possui SAP HANA?</Label>
                  <select
                    id="possui_hana"
                    name="possui_hana"
                    value={formData.respostas.possui_hana || ''}
                    onChange={(e) => updateResposta('possui_hana', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Selecione</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="versao_sap" className="text-sm font-medium">Versão do SAP Business One</Label>
                  <Input
                    id="versao_sap"
                    name="versao_sap"
                    value={formData.respostas.versao_sap || ''}
                    onChange={(e) => updateResposta('versao_sap', e.target.value)}
                    placeholder="Ex: 10.0"
                  />
                </div>
              </div>
            </div>

            {/* Dados SMTP */}
            <div className="space-y-4 p-4 border rounded-lg bg-purple-50">
              <h3 className="font-semibold text-purple-900">📧 Configurações de E-mail (SMTP)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_servidor" className="text-sm font-medium">Servidor SMTP</Label>
                  <Input
                    id="smtp_servidor"
                    name="smtp_servidor"
                    value={formData.respostas.smtp_servidor || ''}
                    onChange={(e) => updateResposta('smtp_servidor', e.target.value)}
                    placeholder="Ex: smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_porta" className="text-sm font-medium">Porta SMTP</Label>
                  <Input
                    id="smtp_porta"
                    name="smtp_porta"
                    value={formData.respostas.smtp_porta || ''}
                    onChange={(e) => updateResposta('smtp_porta', e.target.value)}
                    placeholder="Ex: 587"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_usuario" className="text-sm font-medium">Usuário SMTP</Label>
                  <Input
                    id="smtp_usuario"
                    name="smtp_usuario"
                    value={formData.respostas.smtp_usuario || ''}
                    onChange={(e) => updateResposta('smtp_usuario', e.target.value)}
                    placeholder="Ex: sistema@empresa.com.br"
                  />
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
              <h3 className="font-semibold text-yellow-900">👤 Informações do Responsável Técnico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsavel_tecnico" className="text-sm font-medium">Responsável Técnico *</Label>
                  <Input
                    id="responsavel_tecnico"
                    name="responsavel_tecnico"
                    value={formData.respostas.responsavel_tecnico || ''}
                    onChange={(e) => updateResposta('responsavel_tecnico', e.target.value)}
                    required
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone_responsavel" className="text-sm font-medium">Telefone do Responsável</Label>
                  <Input
                    id="telefone_responsavel"
                    name="telefone_responsavel"
                    value={formData.respostas.telefone_responsavel || ''}
                    onChange={(e) => updateResposta('telefone_responsavel', e.target.value)}
                    placeholder="Ex: (11) 9999-9999"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="data_instalacao_desejada" className="text-sm font-medium">Data Desejada para Instalação</Label>
                  <Input
                    id="data_instalacao_desejada"
                    name="data_instalacao_desejada"
                    type="date"
                    value={formData.respostas.data_instalacao_desejada || ''}
                    onChange={(e) => updateResposta('data_instalacao_desejada', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="observacoes_infraestrutura" className="text-sm font-medium">Observações sobre Infraestrutura</Label>
                  <textarea
                    id="observacoes_infraestrutura"
                    name="observacoes_infraestrutura"
                    value={formData.respostas.observacoes_infraestrutura || ''}
                    onChange={(e) => updateResposta('observacoes_infraestrutura', e.target.value)}
                    className="w-full p-3 border rounded-md h-24 resize-none"
                    placeholder="Informações adicionais sobre a infraestrutura, firewall, políticas de segurança, etc."
                  />
                </div>
              </div>
            </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais que considera relevantes..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white font-medium px-8"
                >
                  {submitting ? "Enviando..." : "Enviar Formulário"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}