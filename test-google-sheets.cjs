// Teste de integração com Google Sheets usando as credenciais do projeto (CommonJS)

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

async function testGoogleSheetsAccess() {
  try {
    console.log('\n=== Teste de acesso à planilha Google Sheets ===\n');
    
    const accessToken = await getAccessToken(GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY);
    console.log('Token de acesso obtido (primeiros 50 chars):', accessToken.substring(0, 50) + '...');
    
    const sheetName = 'V2 DENOMINADOR (TOTAL)';
    const range = 'A1:Z10';
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${encodeURIComponent(`${sheetName}!${range}`)}`;
    
    console.log(`\nBuscando dados da planilha: ${sheetName}!${range}`);
    
    const response = await fetch(sheetUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    console.log(`Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      console.error('Erro ao acessar planilha:', data);
      return;
    }
    
    const rows = data.values;
    console.log(`\nNúmero de linhas retornadas: ${rows ? rows.length : 0}`);
    
    if (rows && rows.length > 0) {
      console.log('\nPrimeiras 3 linhas:');
      rows.slice(0, 3).forEach((row, i) => {
        console.log(`Linha ${i}:`, row);
      });
      
      console.log('\nCabeçalhos encontrados (primeira linha):');
      console.log(rows[0]);
    } else {
      console.log('Planilha vazia ou sem dados no intervalo especificado.');
    }
    
  } catch (error) {
    console.error('Erro durante o teste:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Executar teste
testGoogleSheetsAccess();