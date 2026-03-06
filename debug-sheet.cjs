const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Falha ao obter token Google: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function debugSheet() {
  try {
    console.log('=== Debug da aba V2 DENOMINADOR (TOTAL) ===\n');
    
    const accessToken = await getAccessToken(GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY);
    
    const sheetName = 'V2 DENOMINADOR (TOTAL)';
    // Buscar até 50 linhas para ver estrutura
    const range = 'A1:Z50';
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${encodeURIComponent(`${sheetName}!${range}`)}`;
    
    const response = await fetch(sheetUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    
    if (!response.ok) {
      console.error('Erro:', data);
      return;
    }
    
    const rows = data.values;
    console.log(`Total de linhas retornadas: ${rows ? rows.length : 0}\n`);
    
    if (!rows || rows.length === 0) {
      console.log('Planilha vazia.');
      return;
    }
    
    // Imprimir cada linha com índice e valores
    console.log('=== Linhas (índice: valores) ===');
    rows.forEach((row, i) => {
      // Filtrar valores vazios
      const nonEmpty = row.map((cell, j) => cell ? `[${j}:${cell}]` : '').filter(Boolean);
      console.log(`${i}: ${nonEmpty.join(' ')}`);
    });
    
    // Procurar padrões de cabeçalho
    console.log('\n=== Análise de possíveis cabeçalhos ===');
    const possibleHeaderRows = [];
    rows.forEach((row, i) => {
      // Se a linha contém "UNIDADE", "NOME", "CNS", etc
      const rowText = row.join(' ').toLowerCase();
      if (rowText.includes('unidade') || rowText.includes('nome') || rowText.includes('cns') || rowText.includes('equipe') || rowText.includes('micro')) {
        possibleHeaderRows.push({ index: i, row });
      }
    });
    
    if (possibleHeaderRows.length > 0) {
      console.log('Possíveis linhas de cabeçalho encontradas:');
      possibleHeaderRows.forEach(({ index, row }) => {
        console.log(`Linha ${index}: ${row.map((c, i) => c ? `${i}:${c}` : '').filter(Boolean).join(', ')}`);
      });
    } else {
      console.log('Nenhuma linha de cabeçalho encontrada (sem palavras-chave).');
    }
    
  } catch (error) {
    console.error('Erro durante debug:', error.message);
  }
}

debugSheet();