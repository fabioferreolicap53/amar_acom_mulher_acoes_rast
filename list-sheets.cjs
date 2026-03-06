// Listar todas as abas da planilha Google e seus cabeçalhos

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Carregar variáveis do .dev.vars
const envVars = {};
const envContent = fs.readFileSync(path.join(__dirname, '.dev.vars'), 'utf8');
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const GOOGLE_SERVICE_ACCOUNT_EMAIL = envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = envVars.GOOGLE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
const GOOGLE_SHEETS_ID = envVars.GOOGLE_SHEETS_ID;

console.log('Credenciais carregadas:');
console.log(`- Email: ${GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
console.log(`- Sheet ID: ${GOOGLE_SHEETS_ID}`);
console.log(`- Chave privada: ${GOOGLE_PRIVATE_KEY.substring(0, 50)}...`);

async function createJWT(email, privateKey, scopes) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const encodedClaim = Buffer.from(JSON.stringify(claim)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Processar chave privada (PEM para binário)
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  
  let pemContents = privateKey;
  if (privateKey.includes(pemHeader)) {
    pemContents = privateKey.substring(
      privateKey.indexOf(pemHeader) + pemHeader.length,
      privateKey.indexOf(pemFooter)
    );
  }
  
  const binaryDerString = Buffer.from(pemContents.replace(/\s/g, ''), 'base64');
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  }, 'base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${signatureInput}.${signature}`;
}

async function getAccessToken(email, privateKey) {
  const jwt = await createJWT(email, privateKey, ['https://www.googleapis.com/auth/spreadsheets.readonly']);
  
  console.log('JWT criado (primeiros 100 chars):', jwt.substring(0, 100) + '...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const data = await response.json();
  console.log('Resposta OAuth2:', { status: response.status, ok: response.ok });
  
  if (!response.ok) {
    throw new Error(`Erro OAuth2: ${JSON.stringify(data)}`);
  }
  
  return data.access_token;
}

async function listSheets() {
  try {
    console.log('\n=== Listando abas da planilha Google Sheets ===\n');
    
    const accessToken = await getAccessToken(GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY);
    console.log('Token de acesso obtido (primeiros 50 chars):', accessToken.substring(0, 50) + '...');
    
    // Obter metadados da planilha
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}`;
    console.log(`\nBuscando metadados: ${metadataUrl}`);
    
    const metadataResponse = await fetch(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const metadata = await metadataResponse.json();
    console.log(`Status da resposta: ${metadataResponse.status}`);
    
    if (!metadataResponse.ok) {
      console.error('Erro ao acessar metadados:', metadata);
      return;
    }
    
    console.log('\n=== Abas encontradas ===');
    if (metadata.sheets && metadata.sheets.length > 0) {
      metadata.sheets.forEach((sheet, index) => {
        console.log(`${index + 1}. Título: "${sheet.properties.title}", ID: ${sheet.properties.sheetId}, Tipo: ${sheet.properties.sheetType}`);
      });
    } else {
      console.log('Nenhuma aba encontrada.');
      return;
    }
    
    // Para cada aba, obter cabeçalhos (primeira linha)
    console.log('\n=== Analisando cabeçalhos de cada aba ===');
    
    for (const sheet of metadata.sheets) {
      const sheetTitle = sheet.properties.title;
      console.log(`\n--- Aba: "${sheetTitle}" ---`);
      
      // Buscar primeira linha (A1:Z1)
      const range = 'A1:Z1';
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${encodeURIComponent(`${sheetTitle}!${range}`)}`;
      
      try {
        const response = await fetch(sheetUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.log(`  Erro ao buscar cabeçalhos: ${data.error ? data.error.message : response.status}`);
          continue;
        }
        
        const rows = data.values;
        if (rows && rows.length > 0) {
          const headers = rows[0];
          console.log(`  Número de colunas: ${headers.length}`);
          console.log(`  Cabeçalhos: ${headers.join(', ')}`);
          
          // Verificar se contém colunas interessantes
          const interestingCols = ['TELEFONE', 'SITUAÇÃO', 'TELEFONE', 'SITUACAO', 'TELEFONE', 'TELEFONE', 'TELEFONE', 'TELEFONE'];
          const found = headers.filter(h => interestingCols.includes(h.toUpperCase()));
          if (found.length > 0) {
            console.log(`  ★ Colunas relevantes encontradas: ${found.join(', ')}`);
          }
        } else {
          console.log('  Planilha vazia ou sem cabeçalhos.');
        }
      } catch (error) {
        console.log(`  Erro ao processar aba: ${error.message}`);
      }
    }
    
    // Testar também a aba atual usada pelo sistema (V2 DENOMINADOR (TOTAL))
    console.log('\n=== Verificando aba atual do sistema (V2 DENOMINADOR (TOTAL)) ===');
    const currentSheet = 'V2 DENOMINADOR (TOTAL)';
    const range = 'A1:Z10';
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${encodeURIComponent(`${currentSheet}!${range}`)}`;
    
    try {
      const response = await fetch(sheetUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.log(`Erro ao buscar dados da aba atual: ${data.error ? data.error.message : response.status}`);
      } else {
        const rows = data.values;
        if (rows && rows.length > 0) {
          console.log(`Total de linhas: ${rows.length}`);
          console.log('Cabeçalhos:', rows[0]);
          console.log('Exemplo de dados (linha 2):', rows[1] || 'Nenhuma linha de dados');
        }
      }
    } catch (error) {
      console.log(`Erro: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Erro durante o teste:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Executar
listSheets();