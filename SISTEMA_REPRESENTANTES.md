
# Sistema de Representantes e Chamados

## Visão Geral

Este documento descreve a estrutura do sistema de representantes, clientes e usuários externos.

## Estrutura de Dados

### 1. Representantes
- Anteriormente chamados de "Consultorias"
- Parceiros que vendem e dão suporte aos produtos
- Podem ter múltiplos clientes

### 2. Clientes (Licenses)
- Cada cliente pode ter:
  - **Representante Principal** (opcional)
  - **Representante Secundário** (opcional)
- Ambos os campos podem ser vazios (atendimento direto)

### 3. Tipos de Usuários

#### Usuários Internos (DWU)
- **Admin**: Acesso total ao sistema
- **Support**: Técnicos de suporte

#### Usuários Externos
##### Representante
- Vinculado a um representante específico
- Tipos:
  - **Gerente/Supervisor**: Vê todos os chamados do representante
  - **Analista**: Vê apenas os chamados que ele abriu

##### Cliente Final
- Vinculado a um cliente específico
- Tipos:
  - **Gerente/Supervisor**: Vê todos os chamados do cliente
  - **Analista**: Vê apenas os chamados que ele abriu

## Fluxos de Atendimento

### Cenário 1: Atendimento via Representante
```
Cliente XPTO → Representante A → DWU Suporte
```
- Representante informa qual cliente tem problema
- Representante relata a questão
- Chamado é registrado com `tipo_abertura = 'representante'`

### Cenário 2: Atendimento Direto
```
Cliente XPTO → DWU Suporte (Chamado/WhatsApp direto)
```
- Cliente abre chamado diretamente
- Chamado é registrado com `tipo_abertura = 'cliente_direto'`

### Cenário 3: Cliente com Múltiplos Representantes
- Cliente ABC tem:
  - Representante Principal: UpperTools
  - Representante Secundário: Fernando
- Ambos podem abrir chamados para o cliente

## Campos do Banco de Dados

### Tabela `users`
- `role`: 'admin' | 'support' | 'representante' | 'cliente_final'
- `tipo_usuario`: 'gerente' | 'analista' (apenas externos)
- `representante_id`: ID do representante (se role = 'representante')
- `cliente_id`: Código do cliente (se role = 'cliente_final')

### Tabela `licenses` (Clientes)
- `representante_principal_id`: ID do representante principal (opcional)
- `representante_secundario_id`: ID do representante secundário (opcional)

### Tabela `cliente_historico`
- `tipo_abertura`: 'representante' | 'cliente_direto'
- `usuario_abertura_id`: ID do usuário que abriu (se externo)
- `representante_id`: ID do representante (mantido para compatibilidade)

## Regras de Negócio

1. Um representante pode ter N clientes
2. Um cliente pode ter 0, 1 ou 2 representantes
3. Gerentes veem todos os chamados de sua entidade
4. Analistas veem apenas os chamados que abriram
5. Usuários DWU (admin/support) veem tudo
