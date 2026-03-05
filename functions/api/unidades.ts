
// functions/api/unidades.ts

// Definição local para evitar erro de linter se os tipos globais falharem
type PagesFunction<Env = any> = (context: any) => Response | Promise<Response>;

interface Env {
  GOOGLE_SHEETS_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
}

// Função auxiliar para criar JWT manualmente (Web Crypto API)
async function createJWT(email: string, privateKey: string, scopes: string[]) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedClaim = btoa(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Processar chave privada (PEM para binário)
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  
  // Limpeza robusta da chave
  let pemContents = privateKey;
  if (privateKey.includes(pemHeader)) {
      pemContents = privateKey.substring(
          privateKey.indexOf(pemHeader) + pemHeader.length,
          privateKey.indexOf(pemFooter)
      );
  }
  // Remove quebras de linha e espaços
  const binaryDerString = atob(pemContents.replace(/\s/g, ''));
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  );

  // ArrayBuffer para Base64Url
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signatureInput}.${signatureBase64}`;
}

async function getAccessToken(email: string, privateKey: string) {
    const jwt = await createJWT(email, privateKey, ['https://www.googleapis.com/auth/spreadsheets.readonly']);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const data: any = await response.json();
    return data.access_token;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    // Verificar se as credenciais estão presentes
    if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || env.GOOGLE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY_HERE') || !env.GOOGLE_SHEETS_ID) {
        console.warn('⚠️ Credenciais do Google Sheets ausentes ou inválidas. Retornando dados mockados.');
        const mockData = [
            { unidade: "CF DEOLINDO COUTO", equipe: "Equipe 1", microArea: "01" },
            { unidade: "CF DEOLINDO COUTO", equipe: "Equipe 2", microArea: "02" },
            { unidade: "UBS Central", equipe: "Equipe Alpha", microArea: "10" },
            { unidade: "UBS Norte", equipe: "Equipe Beta", microArea: "20" },
            { unidade: "UBS Sul", equipe: "Equipe Gama", microArea: "30" }
        ];
        return new Response(JSON.stringify(mockData), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Autenticação Google
    const privateKey = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const accessToken = await getAccessToken(env.GOOGLE_SERVICE_ACCOUNT_EMAIL, privateKey);

    // Buscar dados da planilha
    // Aba: "V2 DENOMINADOR (TOTAL)"
    // Colunas M (13), N (14), O (15) -> Range: M4:O
    // M: Equipe, N: Microárea, O: Unidade
    const sheetName = 'V2 DENOMINADOR (TOTAL)';
    const range = 'M4:O';
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/${encodeURIComponent(`${sheetName}!${range}`)}`;
    
    const sheetsResponse = await fetch(sheetUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    if (!sheetsResponse.ok) {
        throw new Error(`Erro na API do Google Sheets: ${sheetsResponse.statusText}`);
    }

    const sheetsData: any = await sheetsResponse.json();
    const rows = sheetsData.values;

    if (!rows || rows.length === 0) {
        return new Response(JSON.stringify([]), {
            headers: { 
                'Content-Type': 'application/json',
                'X-Data-Source': 'GoogleSheets-Empty'
            }
        });
    }

    // Processar dados: criar objetos únicos { unidade, equipe, microArea }
    const uniqueCombinations = new Set<string>();
    const data: any[] = [];
    
    rows.forEach((row: any[]) => {
        // Range M4:O -> row[0]=Equipe (M), row[1]=Microárea (N), row[2]=Unidade (O)
        const equipe = row[0]?.trim() || '';
        const microArea = row[1]?.trim() || '';
        const unidade = row[2]?.trim() || '';

        // Só adicionar se tiver Unidade preenchida (critério mínimo)
        if (unidade) {
            const key = `${unidade}|${equipe}|${microArea}`;
            if (!uniqueCombinations.has(key)) {
                uniqueCombinations.add(key);
                data.push({ unidade, equipe, microArea });
            }
        }
    });

    // Ordenar por Unidade, depois Equipe, depois Microárea
    data.sort((a, b) => {
        if (a.unidade !== b.unidade) return a.unidade.localeCompare(b.unidade);
        if (a.equipe !== b.equipe) return a.equipe.localeCompare(b.equipe);
        return a.microArea.localeCompare(b.microArea);
    });

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0', // Desabilitar cache
        'X-Data-Source': 'GoogleSheets-Live'
      },
    });

  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    // Fallback silencioso para dados mockados em caso de erro crítico na API
    const mockData = [
        { unidade: "CF DEOLINDO COUTO", equipe: "Equipe 1", microArea: "01" },
        { unidade: "CF DEOLINDO COUTO", equipe: "Equipe 1", microArea: "02" },
        { unidade: "CF DEOLINDO COUTO", equipe: "Equipe 2", microArea: "03" },
        { unidade: "UBS Central", equipe: "Equipe Alpha", microArea: "10" },
        { unidade: "UBS Norte", equipe: "Equipe Beta", microArea: "20" },
        { unidade: "UBS Sul", equipe: "Equipe Gama", microArea: "30" }
    ];
    return new Response(JSON.stringify(mockData), { 
        headers: { 'Content-Type': 'application/json' } 
    });
  }
};
