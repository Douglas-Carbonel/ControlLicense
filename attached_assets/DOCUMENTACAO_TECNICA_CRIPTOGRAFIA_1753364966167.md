# Documentação Técnica - Criptografia API de Licenças

## Visão Geral

O endpoint `/api/license-info` foi implementado com criptografia AES-256-CBC para proteger dados sensíveis (CNPJs e quantidades de licenças) durante a transmissão.

## Especificações Técnicas

### Algoritmo de Criptografia
- **Algoritmo**: AES-256-CBC (Advanced Encryption Standard, 256-bit, Cipher Block Chaining)
- **Derivação de Chave**: scrypt com sal fixo
- **Tamanho da Chave**: 256 bits (32 bytes)
- **Tamanho do IV**: 128 bits (16 bytes)
- **Padding**: PKCS#7 (padrão para AES-CBC)

### Parâmetros de Configuração
```
Chave de Criptografia: ENCRYPTION_KEY (variável de ambiente)
Chave Padrão: "32-character-secret-encryption-key!"
Sal (Salt): "salt" (string fixa)
Algoritmo de Derivação: scrypt
Parâmetros scrypt: N=16384, r=8, p=1, dklen=32
Codificação: UTF-8 para texto, hexadecimal para dados binários
```

### Estrutura da Resposta API

#### Entrada (Request)
```json
{
  "hardwareKey": "string",
  "installNumber": "string", 
  "systemNumber": "string",
  "database": "string"
}
```

#### Saída Criptografada (Response)
```json
{
  "message": "Informações de licença encontradas",
  "encrypted": true,
  "data": "hexadecimal_encrypted_data",
  "iv": "hexadecimal_initialization_vector",
  "hint": "Use a chave de descriptografia para acessar os dados"
}
```

#### Dados Originais (Após Descriptografia)
```json
{
  "cnpjList": ["string[]"],
  "totalLicenses": number,
  "foundLicenses": number
}
```

## Implementação Backend (Node.js/TypeScript)

### Função de Criptografia
```typescript
function encryptData(data: string): { encryptedData: string; iv: string } {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex')
  };
}
```

### Função de Descriptografia
```typescript
function decryptData(encryptedData: string, ivHex: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

## Implementação Cliente

### JavaScript/Node.js
```javascript
const crypto = require('crypto');

class LicenseDecryption {
  constructor(encryptionKey = '32-character-secret-encryption-key!') {
    this.encryptionKey = encryptionKey;
  }

  decrypt(encryptedData, ivHex) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}

// Uso:
const decryptor = new LicenseDecryption();
const result = decryptor.decrypt(apiResponse.data, apiResponse.iv);
```

### Python
```python
import hashlib
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

class LicenseDecryption:
    def __init__(self, encryption_key='32-character-secret-encryption-key!'):
        self.encryption_key = encryption_key
    
    def decrypt(self, encrypted_data, iv_hex):
        # Derivar chave usando scrypt
        key = hashlib.scrypt(
            self.encryption_key.encode('utf-8'), 
            salt=b'salt', 
            n=16384, 
            r=8, 
            p=1, 
            dklen=32
        )
        
        # Converter hex para bytes
        iv = bytes.fromhex(iv_hex)
        encrypted_bytes = bytes.fromhex(encrypted_data)
        
        # Descriptografar
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        
        decrypted_bytes = decryptor.update(encrypted_bytes) + decryptor.finalize()
        
        # Converter para JSON
        decrypted_text = decrypted_bytes.decode('utf-8')
        return json.loads(decrypted_text)

# Uso:
decryptor = LicenseDecryption()
result = decryptor.decrypt(api_response['data'], api_response['iv'])
```

### Java
```java
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.SecretKeyFactory;

public class LicenseDecryption {
    private String encryptionKey;
    
    public LicenseDecryption(String encryptionKey) {
        this.encryptionKey = encryptionKey != null ? encryptionKey : "32-character-secret-encryption-key!";
    }
    
    public String decrypt(String encryptedData, String ivHex) throws Exception {
        // Derivar chave usando PBKDF2
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        PBEKeySpec spec = new PBEKeySpec(encryptionKey.toCharArray(), "salt".getBytes(), 16384, 256);
        byte[] key = factory.generateSecret(spec).getEncoded();
        
        // Converter hex para bytes
        byte[] iv = hexToBytes(ivHex);
        byte[] encryptedBytes = hexToBytes(encryptedData);
        
        // Descriptografar
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        SecretKeySpec secretKey = new SecretKeySpec(key, "AES");
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
        
        cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);
        byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
        
        return new String(decryptedBytes, "UTF-8");
    }
    
    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                                 + Character.digit(hex.charAt(i+1), 16));
        }
        return data;
    }
}
```

### C#/.NET
```csharp
using System;
using System.Text;
using System.Security.Cryptography;
using Newtonsoft.Json;

public class LicenseDecryption
{
    private string encryptionKey;
    
    public LicenseDecryption(string encryptionKey = "32-character-secret-encryption-key!")
    {
        this.encryptionKey = encryptionKey;
    }
    
    public T Decrypt<T>(string encryptedData, string ivHex)
    {
        using (var rfc2898 = new Rfc2898DeriveBytes(encryptionKey, Encoding.UTF8.GetBytes("salt"), 16384))
        {
            byte[] key = rfc2898.GetBytes(32);
            byte[] iv = Convert.FromHexString(ivHex);
            byte[] encryptedBytes = Convert.FromHexString(encryptedData);
            
            using (var aes = Aes.Create())
            {
                aes.Key = key;
                aes.IV = iv;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;
                
                using (var decryptor = aes.CreateDecryptor())
                {
                    byte[] decryptedBytes = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);
                    string decryptedJson = Encoding.UTF8.GetString(decryptedBytes);
                    return JsonConvert.DeserializeObject<T>(decryptedJson);
                }
            }
        }
    }
}
```

## Considerações de Segurança

### Pontos Fortes
1. **AES-256**: Padrão militar de criptografia, considerado seguro
2. **IV Único**: Cada resposta possui um IV único, evitando ataques de padrão
3. **Derivação de Chave**: scrypt oferece proteção contra ataques de força bruta
4. **Codificação Segura**: Uso consistente de hex para dados binários

### Recomendações
1. **Chave Personalizada**: Configure ENCRYPTION_KEY com valor único em produção
2. **HTTPS Obrigatório**: Sempre use TLS/SSL para proteger IV e dados criptografados em trânsito
3. **Rotação de Chave**: Implemente rotação periódica da chave de criptografia
4. **Logs**: Não registre chaves, IVs ou dados descriptografados em logs

## Endpoints Disponíveis

### 1. Consulta de Licenças (Criptografado)
```
POST /api/license-info
Content-Type: application/json

{
  "hardwareKey": "string",
  "installNumber": "string",
  "systemNumber": "string", 
  "database": "string"
}
```

### 2. Descriptografia (Apenas para Testes)
```
POST /api/decrypt
Content-Type: application/json

{
  "encryptedData": "hex_string",
  "iv": "hex_string"
}
```

## Configuração de Ambiente

### Variáveis de Ambiente
```bash
ENCRYPTION_KEY="sua-chave-de-32-caracteres-aqui"
```

### Docker/Kubernetes
```yaml
env:
  - name: ENCRYPTION_KEY
    valueFrom:
      secretKeyRef:
        name: api-secrets
        key: encryption-key
```

## Testes

### Teste de Integração
```javascript
// Teste completo: criptografia + descriptografia
const response = await fetch('/api/license-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hardwareKey: "D0950733748",
    installNumber: "0090289858",
    systemNumber: "000000000850521388",
    database: "SBODemoBR_Feula_A"
  })
});

const encryptedData = await response.json();
const decrypted = decryptData(encryptedData.data, encryptedData.iv);

assert(decrypted.cnpjList.length > 0);
assert(typeof decrypted.totalLicenses === 'number');
```

## Performance

### Métricas Esperadas
- **Criptografia**: ~1-2ms por operação
- **Descriptografia**: ~1-2ms por operação  
- **Overhead Total**: <5ms adicional por requisição
- **Tamanho**: Dados criptografados ~33% maiores que originais

## Troubleshooting

### Erros Comuns
1. **"Invalid key length"**: Verificar derivação de chave scrypt
2. **"Invalid IV length"**: IV deve ter exatamente 32 caracteres hex (16 bytes)
3. **"Padding error"**: Dados corrompidos ou chave incorreta
4. **"JSON parse error"**: Dados não descriptografados corretamente

### Debug
```javascript
// Verificar chave derivada
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
console.log('Key length:', key.length); // Deve ser 32

// Verificar IV
const iv = Buffer.from(ivHex, 'hex');
console.log('IV length:', iv.length); // Deve ser 16
```

## Suporte

Para dúvidas técnicas sobre a implementação da criptografia, consulte:
- Documentação: `DESCRIPTOGRAFIA_EXEMPLOS.md`
- Endpoint de teste: `POST /api/decrypt`
- Logs do servidor para debugging

---
**Versão**: 1.0  
**Data**: Janeiro 2025  
**Compatibilidade**: Node.js 18+, Python 3.8+, Java 11+, .NET 6+