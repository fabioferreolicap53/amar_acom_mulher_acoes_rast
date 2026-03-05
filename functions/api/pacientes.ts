// Versão simplificada sem dependências nativas pesadas
import PocketBase from 'pocketbase';

// Definição local para evitar erro de linter se os tipos globais falharem
type PagesFunction<Env = any> = (context: any) => Response | Promise<Response>;

interface Env {
  POCKETBASE_URL: string;
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

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Validar Autenticação (PocketBase)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }

  const pb = new PocketBase(env.POCKETBASE_URL || 'https://centraldedados.dev.br');
  pb.authStore.save(authHeader, null);

  try {
    const authData = await pb.collection('amar_acom_mulher_acoes_rast_usuarios').authRefresh();
    const user = authData.record;

    if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // 2. Obter dados do Google Sheets
    if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || env.GOOGLE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY_HERE') || !env.GOOGLE_SHEETS_ID) {
        // MOCK DATA (V2)
        console.warn('⚠️ Credenciais do Google Sheets ausentes ou inválidas. Retornando dados mockados (Estrutura V2).');
        const mockData = [
            { id: '123', 'Nome Completo': 'Maria Silva', 'Unidade de Saúde': 'UBS Central', 'Equipe': '110', 'Micro Área': '01', 'Data de Nascimento': '1980-05-12', 'Telefone': '(11) 99999-1111', 'Data Coleta': '2024-01-01', 'Situação': 'pendente',
              nome: 'Maria Silva', unidade: 'UBS Central', equipe: '110', micro_area: '01', data_nascimento: '1980-05-12', telefone: '(11) 99999-1111', exame_a: '2024-01-01', status: 'pendente' },
            { id: '124', 'Nome Completo': 'Joana Souza', 'Unidade de Saúde': 'UBS Norte', 'Equipe': '110', 'Micro Área': '02', 'Data de Nascimento': '1992-08-23', 'Telefone': '(11) 99999-2222', 'Data Coleta': '2024-02-01', 'Situação': 'ok',
              nome: 'Joana Souza', unidade: 'UBS Norte', equipe: '110', micro_area: '02', data_nascimento: '1992-08-23', telefone: '(11) 99999-2222', exame_a: '2024-02-01', status: 'ok' },
            { id: '125', 'Nome Completo': 'Ana Costa', 'Unidade de Saúde': 'UBS Sul', 'Equipe': '111', 'Micro Área': '01', 'Data de Nascimento': '1975-11-30', 'Telefone': '(11) 99999-3333', 'Data Coleta': '2024-03-01', 'Situação': 'pendente',
              nome: 'Ana Costa', unidade: 'UBS Sul', equipe: '111', micro_area: '01', data_nascimento: '1975-11-30', telefone: '(11) 99999-3333', exame_a: '2024-03-01', status: 'pendente' }
        ];
        
        const filteredMock = mockData.filter(p => 
            (!user.unidade || p.unidade === user.unidade) &&
            (!user.equipe || p.equipe === user.equipe) &&
            (!user.micro_area || p.micro_area === user.micro_area)
        );

        return new Response(JSON.stringify({
            data: filteredMock,
            headers: ['Nome Completo', 'Unidade de Saúde', 'Equipe', 'Micro Área', 'Data de Nascimento', 'Telefone', 'Data Coleta', 'Situação']
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Autenticação Google via Web Crypto API (Sem libs pesadas)
    // Precisamos tratar a chave privada para garantir que as quebras de linha estejam corretas
    const privateKey = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const accessToken = await getAccessToken(env.GOOGLE_SERVICE_ACCOUNT_EMAIL, privateKey);

    const sheetName = 'V2 DENOMINADOR (TOTAL)';
    const range = 'A3:O';
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/${encodeURIComponent(`${sheetName}!${range}`)}`;
    const sheetsResponse = await fetch(sheetUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    const sheetsData: any = await sheetsResponse.json();
    const rows = sheetsData.values;
    
    if (!rows || rows.length === 0) {
        return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Processar e Filtrar Dados
    // A linha 3 contém os cabeçalhos. O range A3:P garante que pegamos até a coluna P (se houver dados extras) ou pelo menos até O.
    // Mapeamento fixo baseado na estrutura conhecida (conforme unidades.ts):
    // Coluna M (índice 12): Equipe
    // Coluna N (índice 13): Microárea
    // Coluna O (índice 14): Unidade
    
    // Vamos usar os cabeçalhos da primeira linha para as propriedades dinâmicas,
    // mas usaremos índices fixos para a filtragem de segurança.
    
    const headers = rows[0].map((h: string) => h.trim());
    
    // Dados começam na linha seguinte aos cabeçalhos
    const rawData = rows.slice(1);

    const filteredData = rawData.filter((row: any[]) => {
        // Índices baseados em A=0, ..., M=12, N=13, O=14
        // Garantir que o array tenha tamanho suficiente
        const pEquipe = row[12] ? String(row[12]).trim() : '';
        const pMicro = row[13] ? String(row[13]).trim() : '';
        const pUnidade = row[14] ? String(row[14]).trim() : '';
        
        const uUnidade = user.unidade ? String(user.unidade).trim() : '';
        const uEquipe = user.equipe ? String(user.equipe).trim() : '';
        const uMicro = user.micro_area ? String(user.micro_area).trim() : '';

        // Se o usuário não tiver unidade vinculada (ex: admin geral), mostra tudo? 
        // Assumindo que usuários comuns sempre têm unidade.
        if (!uUnidade) return true; 

        // Filtragem Hierárquica Estrita
        if (pUnidade !== uUnidade) return false;
        if (uEquipe && pEquipe !== uEquipe) return false;
        if (uMicro && pMicro !== uMicro) return false;

        return true;
    }).map((row: any[]) => {
        // Mapear para objeto usando os cabeçalhos
        const obj: any = {};
        
        // Mapeamento explícito das colunas de estrutura (M, N, O) para chaves garantidas
        obj['equipe'] = row[12];
        obj['micro_area'] = row[13];
        obj['unidade'] = row[14];

        headers.forEach((h: string, i: number) => {
            if (row[i] !== undefined) {
                // Mantém o valor com a chave do cabeçalho original (para exibição dinâmica)
                obj[h] = row[i];
                
                // Mapeamento para chaves normalizadas auxiliares (opcional)
                const lowerH = h.toLowerCase();
                if (lowerH.includes('nome')) obj['nome'] = row[i];
                else if (lowerH.includes('nascimento')) obj['dat-nascimento'] = row[i];
                else if (lowerH.includes('cns')) obj['cns'] = row[i];
            }
        });
        
        // Gerar ID se não tiver (usando CNS ou aleatório)
        if (obj['cns']) {
            obj.id = obj['cns'];
        } else {
            // Tenta achar coluna CNS nos headers se o mapeamento acima falhou
            const cnsIndex = headers.findIndex((h: string) => h.toLowerCase().includes('cns'));
            if (cnsIndex !== -1 && row[cnsIndex]) {
                obj.id = row[cnsIndex];
            } else {
                obj.id = String(Math.random()).slice(2, 10);
            }
        }
        
        return obj;
    });

    return new Response(JSON.stringify({
        data: filteredData,
        headers: headers
    }), {
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0' // Sem cache para garantir dados frescos
        }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
