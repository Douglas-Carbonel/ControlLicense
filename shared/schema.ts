import { pgTable, text, serial, timestamp, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const licenses = pgTable("licenses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(), // Code
  linha: integer("linha"), // Linha
  ativo: boolean("ativo").notNull().default(true), // Ativo (Y/N)
  codCliente: text("cod_cliente").notNull(), // Cod. Cliente
  nomeCliente: text("nome_cliente").notNull(), // Nome Cliente
  dadosEmpresa: text("dados_empresa"), // Dados da empresa
  hardwareKey: text("hardware_key"), // Hardware key
  installNumber: text("install_number"), // Install number
  systemNumber: text("system_number"), // System number
  nomeDb: text("nome_db"), // Nome DB
  descDb: text("desc_db"), // Desc. DB
  endApi: text("end_api"), // End. API
  listaCnpj: text("lista_cnpj"), // Lista de CNPJ
  qtLicencas: integer("qt_licencas"), // Qt. Licenças
  qtLicencasAdicionais: integer("qt_licencas_adicionais").default(0), // Qt. Lic. Adicionais
  versaoSap: text("versao_sap"), // Versão SAP
  observacao: text("observacao").default(""), // Observação
  modulo1: boolean("modulo1").default(false), // Módulo 1
  modulo2: boolean("modulo2").default(false), // Módulo 2
  modulo3: boolean("modulo3").default(false), // Módulo 3
  modulo4: boolean("modulo4").default(false), // Módulo 4
  modulo5: boolean("modulo5").default(false), // Módulo 5

  // Relacionamento com Representantes
  representantePrincipalId: integer("representante_principal_id"), // Pode ser NULL
  representanteSecundarioId: integer("representante_secundario_id"), // Pode ser NULL

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCodeLinha: uniqueIndex("unique_code_linha").on(table.code, table.linha),
}));

// Tabela de usuários do sistema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("support"), // 'admin', 'support', 'representante', 'cliente_final', 'interno'
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),

  // Campos para usuários externos (representante/cliente_final)
  tipoUsuario: text("tipo_usuario"), // 'gerente' ou 'analista' (apenas para representante/cliente_final)
  representanteId: integer("representante_id"), // Se role = 'representante', referencia a qual representante pertence
  clienteId: text("cliente_id"), // Se role = 'cliente_final', referencia a qual cliente pertence (licenses.code)

  // Campos para usuários internos
  setor: text("setor"), // 'desenvolvimento', 'suporte', 'implantacao', 'comercial'
  nivel: text("nivel"), // Para suporte: 'analista_n1', 'analista_n2', 'analista_n3', 'gerente' | Para desenvolvimento: 'dev_web', 'dev_app'

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: integer("resource_id"),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const mensagemSistema = pgTable("mensagem_sistema", {
  id: serial("id").primaryKey(),
  mensagem: text("mensagem").notNull(),
  base: text("base").notNull(), // Referencias licenses.nome_db
  emailUsuario: text("email_usuario"),
  dataValidade: timestamp("data_validade").notNull(),
  hardwareKey: text("hardware_key").notNull(), // Referencias licenses.hardware_key
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Índice composto para relacionamento com licenses
  basehardwareIdx: uniqueIndex("idx_mensagem_base_hardware").on(table.base, table.hardwareKey),
}));

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  linha: true, // O campo linha será gerado automaticamente
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  setor: z.enum(['desenvolvimento', 'suporte', 'implantacao', 'comercial']).optional().nullable(),
  nivel: z.enum(['analista_n1', 'analista_n2', 'analista_n3', 'gerente', 'dev_web', 'dev_app']).optional().nullable(),
  tipoUsuario: z.enum(['gerente', 'analista']).optional().nullable(),
});

export const insertMensagemSistemaSchema = createInsertSchema(mensagemSistema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataValidade: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  emailUsuario: z.string().optional().nullable().or(z.literal('')).transform((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }),
});

// Tabela de histórico de clientes
export const clienteHistorico = pgTable("cliente_historico", {
  id: serial("id").primaryKey(),
  codigoCliente: text("codigo_cliente").notNull(), // Referencia licenses.code
  nomeCliente: text("nome_cliente").notNull(), // Para facilitar buscas
  ambiente: text("ambiente"), // Nome do banco/ambiente atualizado
  versaoInstalada: text("versao_instalada"), // Versão que foi instalada
  versaoAnterior: text("versao_anterior"), // Versão que estava antes
  tipoAtualizacao: text("tipo_atualizacao").notNull(), // 'ATUALIZACAO_MOBILE', 'ATUALIZACAO_PORTAL', 'INSTALACAO', 'ACESSO_REMOTO', 'ATENDIMENTO_WHATSAPP', 'REUNIAO_CLIENTE'
  observacoes: text("observacoes"), // Observações detalhadas
  responsavel: text("responsavel").notNull(), // Quem fez a atualização/acesso
  atendenteSuporteId: text("atendente_suporte_id"), // ID do usuário atendente
  dataUltimoAcesso: timestamp("data_ultimo_acesso"), // Último acesso ao sistema
  casoCritico: boolean("caso_critico").notNull().default(false), // Se é um caso crítico
  statusAtual: text("status_atual").notNull().default('CONCLUIDO'), // 'EM_ANDAMENTO', 'CONCLUIDO', 'PENDENTE'
  tempoGasto: integer("tempo_gasto"), // Tempo em minutos
  problemas: text("problemas"), // Problemas encontrados
  solucoes: text("solucoes"), // Soluções aplicadas
  // Campos para anexos
  anexos: text("anexos").array(), // Array de URLs/caminhos dos anexos (prints)
  // Campos para checklist de instalação
  checklistInstalacao: text("checklist_instalacao"), // JSON string do checklist
  // Campos para checklist de atualização
  checklistAtualizacao: text("checklist_atualizacao"), // JSON string do checklist
  // Observações do checklist
  observacoesChecklist: text("observacoes_checklist"),
  numeroChamado: text("numero_chamado"),
  consultoriaId: integer("consultoria_id"), // Referencia consultorias.id - se atendimento veio via consultoria
  chamadoConsultoria: text("chamado_consultoria"), // Número do chamado na consultoria (ex: UpperTools)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClienteHistoricoSchema = createInsertSchema(clienteHistorico).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataUltimoAcesso: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  tempoGasto: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      const num = parseInt(val);
      return isNaN(num) ? null : num;
    }
    return val;
  }),
  atendenteSuporteId: z.string().optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    return val;
  }),
  anexos: z.array(z.string()).optional().nullable(),
  checklistInstalacao: z.string().optional().nullable(),
  checklistAtualizacao: z.string().optional().nullable(),
  observacoesChecklist: z.string().optional().nullable(),
  numeroChamado: z.string().optional().nullable(),
  consultoriaId: z.union([z.string(), z.number()]).optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      const num = parseInt(val);
      return isNaN(num) ? null : num;
    }
    return val;
  }),
  chamadoConsultoria: z.string().optional().nullable(),
});

export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MensagemSistema = typeof mensagemSistema.$inferSelect;
export type InsertMensagemSistema = z.infer<typeof insertMensagemSistemaSchema>;
export type ClienteHistorico = typeof clienteHistorico.$inferSelect;
export type InsertClienteHistorico = z.infer<typeof insertClienteHistoricoSchema>;

export const licenseSchema = z.object({
  id: z.number().optional(),
  code: z.string(),
  linha: z.number(),
  ativo: z.boolean(),
  nomeCliente: z.string(),
  dadosEmpresa: z.string().optional(),
  hardwareKey: z.string().optional(),
  installNumber: z.string().optional(),
  systemNumber: z.string().optional(),
  nomeDb: z.string().optional(),
  descDb: z.string().optional(),
  endApi: z.string().optional(),
  listaCnpj: z.string().optional(),
  qtLicencas: z.number().optional(),
  qtLicencasAdicionais: z.number().optional(),
  versaoSap: z.string().optional(),
  observacao: z.string().optional(),
  modulo1: z.boolean().optional(),
  modulo2: z.boolean().optional(),
  modulo3: z.boolean().optional(),
  modulo4: z.boolean().optional(),
  modulo5: z.boolean().optional(),
  codCliente: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Schema para consulta de licenças por hardware
export const hardwareLicenseQuerySchema = z.object({
  hardwareKey: z.string().min(1, "Hardware key é obrigatório"),
  systemNumber: z.string().min(1, "System number é obrigatório"),
  installNumber: z.string().min(1, "Install number é obrigatório"),
  database: z.string(), // Permitir string vazia
});

export type HardwareLicenseQuery = z.infer<typeof hardwareLicenseQuerySchema>;

// Tipo de resposta para a consulta de licenças por hardware
export type HardwareLicenseResponse = {
  success: boolean;
  data?: {
    quantidadeLicencas: number;
    cnpjs: string; // CNPJs separados por asteriscos
  };
  message?: string;
};


// Tabela de Representantes (anteriormente Consultorias)
export const representantes = pgTable("representantes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  razaoSocial: text("razao_social"),
  cnpj: text("cnpj"),
  email: text("email"),
  telefone: text("telefone"),
  whatsapp: text("whatsapp"),
  responsavel: text("responsavel"), // Pessoa de contato
  ativo: boolean("ativo").notNull().default(true),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRepresentanteSchema = createInsertSchema(representantes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Representante = InferSelectModel<typeof representantes>;
export type InsertRepresentante = z.infer<typeof insertRepresentanteSchema>;

// Tabela de Chamados
export const chamados = pgTable("chamados", {
  id: serial("id").primaryKey(),
  numero: serial("numero").notNull(),
  categoria: text("categoria").notNull(), // 'INSTALACAO', 'MELHORIA', 'BUG', 'ATENDIMENTO'
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  status: text("status").notNull().default('ABERTO'), // 'ABERTO', 'PENDENTE', 'SOLUCIONADO', 'FECHADO'
  prioridade: text("prioridade").notNull().default('MEDIA'), // 'BAIXA', 'MEDIA', 'ALTA', 'URGENTE'

  // Relacionamentos
  usuarioAberturaId: integer("usuario_abertura_id").notNull(), // Quem abriu o chamado
  solicitanteId: integer("solicitante_id").notNull(),
  clienteId: text("cliente_id").notNull(), // Cliente relacionado (licenses.code)
  representanteId: integer("representante_id"), // Se aplicável

  // Atribuição interna
  atendenteId: integer("atendente_id"), // Usuário interno responsável

  // Datas
  dataAbertura: timestamp("data_abertura").defaultNow().notNull(),
  dataPrevisao: timestamp("data_previsao"),
  dataFechamento: timestamp("data_fechamento"),

  // Campos adicionais
  observacoes: text("observacoes"),
  anexos: text("anexos").array(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de Pendências de Chamados
export const chamadoPendencias = pgTable("chamado_pendencias", {
  id: serial("id").primaryKey(),
  chamadoId: integer("chamado_id").notNull(),
  motivo: text("motivo").notNull(), // 'AGUARDANDO_REPRESENTANTE', 'AGUARDANDO_AGENDAMENTO', 'AGUARDANDO_CLIENTE', 'OUTROS'
  descricao: text("descricao").notNull(),
  responsavelId: integer("responsavel_id").notNull(), // Quem registrou a pendência
  resolvido: boolean("resolvido").notNull().default(false),
  dataResolucao: timestamp("data_resolucao"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de Interações/Comentários em Chamados
export const chamadoInteracoes = pgTable("chamado_interacoes", {
  id: serial("id").primaryKey(),
  chamadoId: integer("chamado_id").notNull(),
  usuarioId: integer("usuario_id").notNull(),
  mensagem: text("mensagem").notNull(),
  anexos: text("anexos").array(),
  tipo: text("tipo").notNull().default('COMENTARIO'), // 'COMENTARIO', 'MUDANCA_STATUS', 'ATRIBUICAO'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChamadoSchema = createInsertSchema(chamados).omit({
  id: true,
  numero: true,
  dataAbertura: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataPrevisao: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  dataFechamento: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  anexos: z.array(z.string()).optional().nullable(),
});

export const insertChamadoPendenciaSchema = createInsertSchema(chamadoPendencias).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataResolucao: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertChamadoInteracaoSchema = createInsertSchema(chamadoInteracoes).omit({
  id: true,
  createdAt: true,
}).extend({
  anexos: z.array(z.string()).optional().nullable(),
});

export type Chamado = InferSelectModel<typeof chamados>;
export type InsertChamado = z.infer<typeof insertChamadoSchema>;
export type ChamadoPendencia = InferSelectModel<typeof chamadoPendencias>;
export type InsertChamadoPendencia = z.infer<typeof insertChamadoPendenciaSchema>;
export type ChamadoInteracao = InferSelectModel<typeof chamadoInteracoes>;
export type InsertChamadoInteracao = z.infer<typeof insertChamadoInteracaoSchema>;