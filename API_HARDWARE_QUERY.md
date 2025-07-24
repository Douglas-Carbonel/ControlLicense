# Endpoint de Consulta de Licenças por Hardware

## Descrição
Este endpoint permite consultar licenças ativas no sistema através dos dados do hardware/sistema.

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
curl -X POST http://localhost:5000/api/licenses/hardware-query \
  -H "Content-Type: application/json" \
  -d '{
    "hardwareKey": "HW001234",
    "systemNumber": "SYS5678",
    "installNumber": "INST9012",
    "database": "PROD_DB"
  }'
```

## Resposta de Sucesso (200)
```json
{
  "success": true,
  "data": {
    "totalLicenses": 15,
    "cnpjList": [
      "12.345.678/0001-90",
      "98.765.432/0001-10"
    ],
    "licenses": [
      {
        "id": 123,
        "code": "C0001234",
        "nomeCliente": "Empresa ABC Ltda",
        "qtLicencas": 10,
        "qtLicencasAdicionais": 5,
        "listaCnpj": "12.345.678/0001-90; 98.765.432/0001-10",
        "ativo": true
      }
    ]
  }
}
```

## Resposta de Erro - Não Encontrado (404)
```json
{
  "success": false,
  "message": "Nenhuma licença encontrada para os dados fornecidos"
}
```

## Resposta de Erro - Dados Inválidos (400)
```json
{
  "success": false,
  "message": "Dados inválidos: Hardware key é obrigatório"
}
```

## Resposta de Erro - Servidor (500)
```json
{
  "success": false,
  "message": "Erro interno do servidor"
}
```

## Funcionalidades
- ✅ Busca licenças ativas que correspondem exatamente aos 4 parâmetros fornecidos
- ✅ Calcula automaticamente o total de licenças (principais + adicionais)
- ✅ Extrai e lista todos os CNPJs únicos encontrados nas licenças
- ✅ Registra todas as consultas no log de atividades para auditoria
- ✅ Validação completa dos dados de entrada
- ✅ Endpoint público (não requer autenticação)

## Notas Importantes
1. **Endpoint Público**: Este endpoint não requer autenticação para permitir consultas de sistemas externos
2. **Busca Exata**: Todos os 4 parâmetros devem corresponder exatamente aos dados no banco
3. **Apenas Licenças Ativas**: Retorna somente licenças com status `ativo = true`
4. **Log de Auditoria**: Todas as consultas são registradas no sistema de atividades
5. **CNPJs**: Podem estar separados por vírgula, ponto e vírgula ou quebras de linha

## Status
✅ **Implementado e Testado** - Endpoint funcionando corretamente em produção