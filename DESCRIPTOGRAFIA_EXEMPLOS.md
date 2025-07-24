# Exemplos de Descriptografia - API de Licenças

Esta documentação contém exemplos práticos de como descriptografar os dados retornados pela API `/api/licenses/hardware-query`.

## Configuração de Criptografia

- **Algoritmo**: AES-256-CBC
- **Chave Padrão**: "32-character-secret-encryption-key!"
- **Derivação**: scrypt com sal "salt"
- **Parâmetros scrypt**: N=16384, r=8, p=1, dklen=32

## Implementações por Linguagem

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

// Exemplo de uso:
const decryptor = new LicenseDecryption();

// Dados de exemplo da API
const apiResponse = {
  "message": "Informações de licença encontradas",
  "encrypted": true,
  "data": "3c46a8f897d727960eb9d46d1c45ac6863facfea6c66ddbd307fcb3683800e1b17d4dfa9144fadc4568132a40948e657409e471c8ce33cbb3053aeab451651ac6b48727f6f847d9b95033e8046b644a2",
  "iv": "36fe424d212ff85e204ac5f6d87df922"
};

const result = decryptor.decrypt(apiResponse.data, apiResponse.iv);
console.log(result);
// Output: { cnpjList: ["13960359000152"], totalLicenses: 23, foundLicenses: 1 }
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
        
        # Remover padding PKCS7
        padding = decrypted_bytes[-1]
        decrypted_bytes = decrypted_bytes[:-padding]
        
        # Converter para JSON
        decrypted_text = decrypted_bytes.decode('utf-8')
        return json.loads(decrypted_text)

# Exemplo de uso:
decryptor = LicenseDecryption()

# Dados de exemplo da API
api_response = {
    "message": "Informações de licença encontradas",
    "encrypted": True,
    "data": "3c46a8f897d727960eb9d46d1c45ac6863facfea6c66ddbd307fcb3683800e1b17d4dfa9144fadc4568132a40948e657409e471c8ce33cbb3053aeab451651ac6b48727f6f847d9b95033e8046b644a2",
    "iv": "36fe424d212ff85e204ac5f6d87df922"
}

result = decryptor.decrypt(api_response['data'], api_response['iv'])
print(result)
# Output: {'cnpjList': ['13960359000152'], 'totalLicenses': 23, 'foundLicenses': 1}
```

### Java
```java
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.SecretKeyFactory;
import com.google.gson.Gson;
import java.util.Map;

public class LicenseDecryption {
    private String encryptionKey;
    
    public LicenseDecryption(String encryptionKey) {
        this.encryptionKey = encryptionKey != null ? encryptionKey : "32-character-secret-encryption-key!";
    }
    
    public Map<String, Object> decrypt(String encryptedData, String ivHex) throws Exception {
        // Derivar chave usando PBKDF2 (aproximação do scrypt)
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
        
        String decryptedJson = new String(decryptedBytes, "UTF-8");
        
        // Converter JSON para Map
        Gson gson = new Gson();
        return gson.fromJson(decryptedJson, Map.class);
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

// Exemplo de uso:
LicenseDecryption decryptor = new LicenseDecryption();
Map<String, Object> result = decryptor.decrypt(
    "3c46a8f897d727960eb9d46d1c45ac6863facfea6c66ddbd307fcb3683800e1b17d4dfa9144fadc4568132a40948e657409e471c8ce33cbb3053aeab451651ac6b48727f6f847d9b95033e8046b644a2",
    "36fe424d212ff85e204ac5f6d87df922"
);
System.out.println(result);
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

// Exemplo de uso:
var decryptor = new LicenseDecryption();
var result = decryptor.Decrypt<dynamic>(
    "3c46a8f897d727960eb9d46d1c45ac6863facfea6c66ddbd307fcb3683800e1b17d4dfa9144fadc4568132a40948e657409e471c8ce33cbb3053aeab451651ac6b48727f6f847d9b95033e8046b644a2",
    "36fe424d212ff85e204ac5f6d87df922"
);
Console.WriteLine(result);
```

## Exemplo Completo - Fluxo de Trabalho

```javascript
// 1. Fazer requisição para a API
const response = await fetch('https://seu-servidor.com/api/licenses/hardware-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hardwareKey: "EF0029328329",
    systemNumber: "00000000000023216",
    installNumber: "0003051848921",
    database: ""
  })
});

const encryptedResponse = await response.json();

// 2. Verificar se a resposta está criptografada
if (encryptedResponse.encrypted) {
  // 3. Descriptografar os dados
  const decryptor = new LicenseDecryption();
  const licenseData = decryptor.decrypt(encryptedResponse.data, encryptedResponse.iv);
  
  // 4. Usar os dados descriptografados
  console.log(`Total de licenças: ${licenseData.totalLicenses}`);
  console.log(`CNPJs encontrados: ${licenseData.cnpjList.join(', ')}`);
  console.log(`Registros encontrados: ${licenseData.foundLicenses}`);
} else {
  console.log('Erro:', encryptedResponse.message);
}
```

## Teste Local

Para testar a descriptografia localmente, você pode usar o endpoint de teste:

```bash
curl -X POST http://localhost:5000/api/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "encryptedData": "3c46a8f897d727960eb9d46d1c45ac6863facfea6c66ddbd307fcb3683800e1b17d4dfa9144fadc4568132a40948e657409e471c8ce33cbb3053aeab451651ac6b48727f6f847d9b95033e8046b644a2",
    "iv": "36fe424d212ff85e204ac5f6d87df922"
  }'
```

## Configuração de Produção

Para produção, defina a variável de ambiente `ENCRYPTION_KEY` com uma chave personalizada de 32 caracteres:

```bash
export ENCRYPTION_KEY="sua-chave-personalizada-de-32-chars"
```

## Estrutura dos Dados Descriptografados

```typescript
interface LicenseData {
  cnpjList: string[];      // Lista de CNPJs encontrados
  totalLicenses: number;   // Total de licenças (principais + adicionais)
  foundLicenses: number;   // Número de registros encontrados
}
```