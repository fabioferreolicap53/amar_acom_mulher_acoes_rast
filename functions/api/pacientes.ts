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
    // Aumentar range para pegar mais colunas se necessário, e começar de A1 para garantir cabeçalhos corretos
    // Antes estava A3:O. Vamos tentar A1:Z para pegar cabeçalhos e mais colunas
    const range = 'A1:Z';
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/${encodeURIComponent(`${sheetName}!${range}`)}`;
    const sheetsResponse = await fetch(sheetUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    const sheetsData: any = await sheetsResponse.json();
    const allRows = sheetsData.values;
    
    if (!allRows || allRows.length === 0) {
        return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
    }

    // Identificar a linha de cabeçalho
    // Procura a linha que contém "Nome" e "Unidade" (ou similar)
    let headerRowIndex = 0;
    // Se começamos de A1, o cabeçalho pode estar na linha 0, 1 ou 2.
    // O código anterior usava A3, o que sugere que o cabeçalho estava na linha 3 (índice 0 do resultado A3:O).
    // Mas se mudamos para A1, precisamos achar onde está.
    
    // Procura linha com "UNIDADE" ou "NOME"
    const foundHeaderIndex = allRows.findIndex((r: string[]) => 
        r.some(c => c && (
            String(c).toUpperCase().includes('UNIDADE') || 
            String(c).toUpperCase().includes('NOME') ||
            String(c).toUpperCase().includes('MICRO')
        ))
    );
    
    if (foundHeaderIndex !== -1) {
        headerRowIndex = foundHeaderIndex;
    } else {
        // Fallback para linha 2 (índice 2, correspondente a A3 se A1=0) se não achar nada, 
        // assumindo estrutura antiga mas com range novo.
        headerRowIndex = 2; 
    }
    
    console.log(`[Pacientes] Linha de cabeçalho detectada: ${headerRowIndex + 1} (Índice: ${headerRowIndex})`);

    const headers = allRows[headerRowIndex].map((h: string) => h ? h.trim() : '');
    const rawData = allRows.slice(headerRowIndex + 1);

    const filteredData = rawData.filter((row: any[]) => {
        // Índices baseados em A=0, ..., M=12, N=13, O=14 (Assumindo que M=Equipe, N=Micro, O=Unidade conforme comentário)
        // MAS precisamos confirmar se os índices estão corretos.
        // Se a planilha mudou, isso quebra.
        // Vamos tentar achar pelo nome da coluna se possível, ou usar fixo se confiarmos.
        // Pela imagem do usuario e contexto anterior:
        // Coluna A (0) = Unidade? Não, na imagem Unidade é a primeira.
        // Vamos assumir que o frontend espera:
        // Unidade, Equipe, Microarea, Nome...
        
        // CORREÇÃO: O código anterior usava índices fixos 12, 13, 14 para Equipe, Micro, Unidade.
        // Vamos verificar se isso faz sentido com o range A3:O.
        // A, B, C, D, E, F, G, H, I, J, K, L, M, N, O
        // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11,12,13,14
        
        // Se a planilha tem:
        // A=UNIDADE, B=EQUIPE, C=MICROÁREA (conforme imagem do frontend)
        // Então os índices seriam 0, 1, 2.
        
        // Vamos tentar detectar dinamicamente pelos headers para ser mais robusto.
        const idxUnidade = headers.findIndex((h: string) => h.toUpperCase().includes('UNIDADE'));
        const idxEquipe = headers.findIndex((h: string) => h.toUpperCase().includes('EQUIPE'));
        const idxMicro = headers.findIndex((h: string) => h.toUpperCase().includes('MICRO') || h.toUpperCase().includes('AREA'));
        
        // Fallback para índices fixos antigos se não achar (14, 12, 13) ou novos (0, 1, 2)
        // Vamos usar 0, 1, 2 como fallback primário pois parece ser o layout visual.
        const finalIdxUnidade = idxUnidade !== -1 ? idxUnidade : 0;
        const finalIdxEquipe = idxEquipe !== -1 ? idxEquipe : 1;
        const finalIdxMicro = idxMicro !== -1 ? idxMicro : 2;

        const pUnidade = row[finalIdxUnidade] ? String(row[finalIdxUnidade]).trim() : '';
        const pEquipe = row[finalIdxEquipe] ? String(row[finalIdxEquipe]).trim() : '';
        const pMicro = row[finalIdxMicro] ? String(row[finalIdxMicro]).trim() : '';

        // Filtragem Hierárquica Estrita
        if (uUnidade && pUnidade !== uUnidade) return false;
        if (uEquipe && pEquipe !== uEquipe) return false;
        if (uMicro && pMicro !== uMicro) return false;

        return true;
    }).map((row: any[]) => {
        // Mapear para objeto
        const obj: any = {};
        
        headers.forEach((h: string, i: number) => {
            if (row[i] !== undefined && h) {
                obj[h] = row[i];
                
                // Normalização de chaves para o frontend
                const lowerH = h.toLowerCase();
                if (lowerH.includes('nome')) obj['nome'] = row[i];
                else if (lowerH.includes('nascimento')) obj['dat-nascimento'] = row[i];
                else if (lowerH.includes('cns')) obj['cns'] = row[i];
                else if (lowerH.includes('unidade')) obj['unidade'] = row[i];
                else if (lowerH.includes('equipe')) obj['equipe'] = row[i];
                else if (lowerH.includes('micro') || lowerH.includes('area')) obj['micro_area'] = row[i];
                else if (lowerH.includes('siscan')) obj['resultado_siscan'] = row[i];
                else if (lowerH.includes('laboratório') && lowerH.includes('resultado')) obj['resultado_laboratorio'] = row[i];
                else if (lowerH.includes('aprovados')) obj['aprovados_laboratorio'] = row[i];
                else if (lowerH.includes('coleta') && lowerH.includes('dna')) obj['coleta_dna_hpv'] = row[i];
                else if (lowerH.includes('resultado') && lowerH.includes('dna')) obj['resultado_dna_hpv'] = row[i];
                else if (lowerH.includes('variável 2')) obj['data_coleta_v2'] = row[i];
            }
        });
        
        // Gerar ID se não tiver
        if (!obj.id) {
             obj.id = obj['cns'] || String(Math.random()).slice(2, 10);
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
