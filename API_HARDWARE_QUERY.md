# Endpoint de Consulta de Licenças por Hardware (CRIPTOGRAFADO)

## Descrição
Este endpoint permite consultar licenças ativas no sistema através dos dados do hardware/sistema com **criptografia AES-256-CBC**.

## Endpoint
```
POST /api/licenses/hardware-query
```

## Parâmetros de Entrada (JSON)
```json
{
  "hardwareKey": "string (obrigatório)",
  "systemNumber": "string (obrigatório)", 
  "installNumber": "string (obrigatório)",
  "database": "string (obrigatório)"
}
```

## Exemplo de Requisição
```bash
curl -X POST https://a071411e-f730-4a92-b8a9-3cb52fbb3677-00-1o09yjnnqsc39.riker.replit.dev/api/licenses/hardware-query \
  -H "Content-Type: application/json" \
  -d '{
    "hardwareKey": "EF0029328329",
    "systemNumber": "00000000000023216",
    "installNumber": "0003051848921",
    "database": ""
  }'
```

## Resposta de Sucesso (200) - **CRIPTOGRAFADA**
```json
{
  "message": "Informações de licença encontradas",
  "encrypted": true,
  "data": "3c46a8f897d727960eb9d46d1c45ac6863facfea6c66ddbd307fcb3683800e1b",
  "iv": "36fe424d212ff85e204ac5f6d87df922",
  "hint": "Use a chave de descriptografia para acessar os dados"
}
```

### Dados Descriptografados
```json
{
  "cnpjList": ["13960359000152"],
  "totalLicenses": 23,
  "foundLicenses": 1
}
```

## Resposta de Erro - Não Encontrado (404)
```json
{
  "message": "Nenhuma licença encontrada para os dados fornecidos",
  "encrypted": false
}
```

## Resposta de Erro - Dados Inválidos (400)
```json
{
  "message": "Dados inválidos: Hardware key é obrigatório",
  "encrypted": false
}
```

## Resposta de Erro - Servidor (500)
```json
{
  "message": "Erro interno do servidor",
  "encrypted": false
}
```

## Funcionalidades
- ✅ **Criptografia AES-256-CBC**: Dados sensíveis protegidos com criptografia militar
- ✅ Busca licenças ativas que correspondem exatamente aos 4 parâmetros fornecidos
- ✅ Calcula automaticamente o total de licenças (principais + adicionais)
- ✅ Extrai e lista todos os CNPJs únicos encontrados nas licenças
- ✅ Registra todas as consultas no log de atividades para auditoria
- ✅ Validação completa dos dados de entrada
- ✅ Endpoint público (não requer autenticação)
- ✅ **Endpoint de teste**: `/api/decrypt` para validar implementação

## Notas Importantes
1. **Endpoint Público**: Este endpoint não requer autenticação para permitir consultas de sistemas externos
2. **Busca Exata**: Todos os 4 parâmetros devem corresponder exatamente aos dados no banco
3. **Apenas Licenças Ativas**: Retorna somente licenças com status `ativo = true`
4. **Log de Auditoria**: Todas as consultas são registradas no sistema de atividades
5. **CNPJs**: Podem estar separados por vírgula, ponto e vírgula ou quebras de linha

## Criptografia

### Especificações Técnicas
- **Algoritmo**: AES-256-CBC (Advanced Encryption Standard)
- **Derivação de Chave**: scrypt com sal fixo "salt"
- **Chave Padrão**: "32-character-secret-encryption-key!"
- **IV**: 16 bytes aleatórios únicos por requisição
- **Codificação**: Hexadecimal

### Como Descriptografar
Consulte o arquivo `DESCRIPTOGRAFIA_EXEMPLOS.md` para implementações completas em:
- JavaScript/Node.js
- Python
- Java
- C#/.NET

### Endpoint de Teste
```bash
POST /api/decrypt
{
  "encryptedData": "dados_em_hex",
  "iv": "iv_em_hex"
}
```

## Status
✅ **Implementado e Testado** - Endpoint com criptografia funcionando corretamente em produção