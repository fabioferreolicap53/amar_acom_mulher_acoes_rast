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

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

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
    if (!response.ok || !data.access_token) {
        throw new Error(`Falha ao obter token Google: ${JSON.stringify(data)}`);
    }
    return data.access_token;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  console.log('[Pacientes] onRequest chamada', request.url);

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

    // Parâmetros de filtro (prioridade: URL > perfil do usuário)
    const url = new URL(request.url);
    const uUnidade = url.searchParams.get('unidade') || user.unidade || '';
    const uEquipe = url.searchParams.get('equipe') || user.equipe || '';
    const uMicro = url.searchParams.get('microArea') || user.micro_area || '';
    console.log(`[Pacientes] Filtros - Unidade: ${uUnidade}, Equipe: ${uEquipe}, Micro: ${uMicro}`);

    // Diagnóstico de variáveis de ambiente
    console.log(`[Pacientes] Env check: Email=${!!env.GOOGLE_SERVICE_ACCOUNT_EMAIL}, Key=${!!env.GOOGLE_PRIVATE_KEY}, Sheet=${!!env.GOOGLE_SHEETS_ID}`);

    // 2. Obter dados do Google Sheets
    // Verificação relaxada para permitir que funcione se as variáveis estiverem presentes
    if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_SHEETS_ID) {
        // MOCK DATA (V2)
        console.warn('⚠️ Credenciais do Google Sheets ausentes. Retornando dados mockados. Configure GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY e GOOGLE_SHEETS_ID no painel do Cloudflare Pages.');
        const mockData = [
            { 
                id: '123', 
                nome: 'Maria Silva', 
                unidade: 'UBS Central', 
                equipe: '110', 
                micro_area: '01', 
                data_nascimento: '1980-05-12', 
                cns: '123456789012345',
                data_coleta_v2: '2024-01-01',
                resultado_siscan: '2024-01-15',
                resultado_laboratorio: '2024-01-10',
                aprovados_laboratorio: '2024-01-02',
                coleta_dna_hpv: 'Sim',
                resultado_dna_hpv: 'Negativo',
                status: 'pendente' 
            },
            { 
                id: '124', 
                nome: 'Joana Souza', 
                unidade: 'UBS Norte', 
                equipe: '110', 
                micro_area: '02', 
                data_nascimento: '1992-08-23', 
                cns: '234567890123456',
                data_coleta_v2: '2024-02-01',
                resultado_siscan: '2024-02-20',
                resultado_laboratorio: '2024-02-15',
                aprovados_laboratorio: '2024-02-05',
                coleta_dna_hpv: 'Não',
                resultado_dna_hpv: '-',
                status: 'ok' 
            },
            { 
                id: '126', 
                nome: 'Claudia Mendes', 
                unidade: 'UBS Leste', 
                equipe: '112', 
                micro_area: '03', 
                data_nascimento: '1985-02-14', 
                cns: '345678901234567',
                data_coleta_v2: '2024-03-10',
                resultado_siscan: '2024-03-25',
                resultado_laboratorio: '2024-03-20',
                aprovados_laboratorio: '2024-03-12',
                coleta_dna_hpv: 'Sim',
                resultado_dna_hpv: 'Positivo',
                status: 'ok' 
            }
        ];
        
        const filteredMock = mockData.filter(p => 
            (!user.unidade || normalizeText(p.unidade) === normalizeText(user.unidade)) &&
            (!user.equipe || normalizeText(p.equipe) === normalizeText(user.equipe)) &&
            (!user.micro_area || normalizeText(p.micro_area) === normalizeText(user.micro_area))
        );

        return new Response(JSON.stringify({
            data: filteredMock,
            headers: [
                'UNIDADE', 'EQUIPE', 'MICROÁREA', 'NOME', 'CNS', 
                'DATA DE NASCIMENTO', 'VARIÁVEL 2 (DATA DA COLETA)', 
                'RESULTADO SISCAN (DATA DO RESULTADO)', 
                'RESULTADO LABORATÓRIO (DATA DO CADASTRO)', 
                'APROVADOS LABORATÓRIO(DATA DA COLETA)', 
                'COLETA DNA HPV', 'RESULTADO DNA HPV'
            ]
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Autenticação Google via Web Crypto API (Sem libs pesadas)
    // Precisamos tratar a chave privada para garantir que as quebras de linha estejam corretas
    const privateKey = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const accessToken = await getAccessToken(env.GOOGLE_SERVICE_ACCOUNT_EMAIL, privateKey);
    console.log('[Pacientes] Token de acesso obtido, buscando planilha...');

    const sheetName = 'V2 DENOMINADOR (TOTAL)';
    // Aumentar range para pegar mais colunas se necessário, e começar de A1 para garantir cabeçalhos corretos
    // Antes estava A3:O. Vamos tentar A1:ZZ para pegar cabeçalhos e mais colunas
    const range = 'A1:ZZ';
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/${encodeURIComponent(`${sheetName}!${range}`)}`;
    const sheetsResponse = await fetch(sheetUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    const sheetsData: any = await sheetsResponse.json();
    console.log(`[Pacientes] Resposta Sheets API status: ${sheetsResponse.status}`);
    if (!sheetsResponse.ok) {
        console.error(`[Pacientes] Erro Sheets API: ${JSON.stringify(sheetsData)}`);
        return new Response(JSON.stringify({ error: 'Erro ao acessar planilha Google' }), { status: 500 });
    }
    const allRows = sheetsData.values;
    console.log(`[Pacientes] Dados brutos da planilha: ${allRows ? allRows.length : 0} linhas`);
    
    if (!allRows || allRows.length === 0) {
        console.warn('[Pacientes] Planilha vazia ou sem dados');
        return new Response(JSON.stringify({ data: [], headers: [] }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Identificar a linha de cabeçalho com pontuação
    let headerRowIndex = 2; // Fallback padrão
    let bestHeaderIndex = -1;
    let maxMatches = 0;

    // Varre as primeiras 10 linhas para achar o cabeçalho
    const searchLimit = Math.min(allRows.length, 10);
    
    for (let i = 0; i < searchLimit; i++) {
        const row = allRows[i];
        let matches = 0;
        row.forEach((cell: string) => {
             const normalized = normalizeText(String(cell || ''));
             if (normalized.includes('unidade') || 
                 normalized.includes('nome') || 
                 normalized.includes('micro') || 
                 normalized.includes('equipe') || 
                 normalized.includes('cns') || 
                 normalized.includes('siscan') || 
                 normalized.includes('laboratorio') ||
                 normalized.includes('variavel')) {
                 matches++;
             }
        });
        
        // Se a linha tem mais matches que a anterior, é a candidata
        if (matches > maxMatches) {
            maxMatches = matches;
            bestHeaderIndex = i;
        }
    }
    
    if (bestHeaderIndex !== -1 && maxMatches >= 2) {
        headerRowIndex = bestHeaderIndex;
        console.log(`[Pacientes] Linha de cabeçalho detectada por pontuação: ${headerRowIndex + 1} (Matches: ${maxMatches})`);
    } else {
        console.warn(`[Pacientes] Cabeçalho não identificado com clareza. Usando fallback linha 3.`);
    }
    
    console.log(`[Pacientes] Linha de cabeçalho detectada: ${headerRowIndex + 1} (Índice: ${headerRowIndex})`);

    const headers: string[] = allRows[headerRowIndex].map((h: string) => h ? h.trim() : '');
    console.log(`[Pacientes] Headers detectados (${headers.length}):`, headers.map((h: string, i: number) => `${i}:${h}`).join(', '));
    const rawData = allRows.slice(headerRowIndex + 1);
    console.log(`[Pacientes] Linhas brutas (rawData): ${rawData.length}`);
    if (rawData.length > 0) {
        console.log(`[Pacientes] Primeira linha bruta:`, rawData[0]);
    }

    const normalizedHeaders = headers.map((h: string) => normalizeText(h));
    console.log('[Pacientes] Headers normalizados:', normalizedHeaders.join(' | '));
    const findHeaderIndex = (exactMatches: string[], partialMatches: string[]) => {
        const exactIndex = normalizedHeaders.findLastIndex((h: string) => exactMatches.includes(h));
        if (exactIndex !== -1) return exactIndex;
        return normalizedHeaders.findLastIndex((h: string) => partialMatches.some((partial) => h.includes(partial)));
    };

    const idxUnidade = findHeaderIndex(['unidade'], ['unidade']);
    const idxEquipe = findHeaderIndex(['equipe'], ['equipe']);
    const idxMicro = findHeaderIndex(['microarea', 'micro area'], ['micro', 'area']);
    const idxCns = findHeaderIndex(['cns'], ['npront', 'sus', 'cns']);
    console.log(`[Pacientes] Índices detectados: Unidade=${idxUnidade}, Equipe=${idxEquipe}, Micro=${idxMicro}`);
    
    const finalIdxUnidade = idxUnidade !== -1 ? idxUnidade : 0;
    const finalIdxEquipe = idxEquipe !== -1 ? idxEquipe : 1;
    const finalIdxMicro = idxMicro !== -1 ? idxMicro : 2;
    console.log(`[Pacientes] Índices finais: Unidade=${finalIdxUnidade}, Equipe=${finalIdxEquipe}, Micro=${finalIdxMicro}`);

    const filteredData = rawData.filter((row: any[]) => {
        // Índices baseados em A=0, ..., M=12, N=13, O=14 (Assumindo que M=Equipe, N=Micro, O=Unidade conforme comentário)
        // MAS precisamos confirmar se os índices estão corretos.
        // Se a planilha mudou, isso quebra.




        const pUnidade = row[finalIdxUnidade] ? String(row[finalIdxUnidade]) : '';
        const pEquipe = row[finalIdxEquipe] ? String(row[finalIdxEquipe]) : '';
        const pMicro = row[finalIdxMicro] ? String(row[finalIdxMicro]) : '';

        // Filtragem Hierárquica Flexível
        const match = (valPlanilha: string, valUsuario: string) => {
            if (!valUsuario) return true;
            const p = normalizeText(valPlanilha);
            const u = normalizeText(valUsuario);
            // Match exato ou parcial (um contendo o outro)
            return p === u || p.includes(u) || u.includes(p);
        };

        if (!match(pUnidade, uUnidade)) return false;
        if (!match(pEquipe, uEquipe)) return false;
        if (!match(pMicro, uMicro)) return false;

        return true;
    }).map((row: any[], rowIndex: number) => {
        // Mapear para objeto
        const obj: any = {};
        
        headers.forEach((h: string, i: number) => {
            if (row[i] !== undefined && h) {
                obj[h] = row[i];
                
                // Normalização de chaves para o frontend
                const normalizedHeader = normalizeText(h);
                if (normalizedHeader.includes('nome')) {
                    obj['nome'] = row[i];
                    obj['name'] = row[i];
                } else if (normalizedHeader.includes('nascimento')) {
                    obj['dat-nascimento'] = row[i];
                    obj['data_nascimento'] = row[i];
                } else if (normalizedHeader === 'cns' || normalizedHeader.includes('npront') || normalizedHeader.includes('sus')) {
                    obj['cns'] = row[i];
                } else if (normalizedHeader.includes('unidade')) {
                    obj['unidade'] = row[i];
                } else if (normalizedHeader.includes('equipe')) {
                    obj['equipe'] = row[i];
                } else if (normalizedHeader.includes('micro') || normalizedHeader.includes('area')) {
                    obj['micro_area'] = row[i];
                } else if (normalizedHeader.includes('siscan')) {
                    obj['resultado_siscan'] = row[i];
                } else if (normalizedHeader.includes('laboratorio') && !normalizedHeader.includes('aprovados')) {
                    obj['resultado_laboratorio'] = row[i];
                } else if (normalizedHeader.includes('aprovados') && normalizedHeader.includes('laboratorio')) {
                    obj['aprovados_laboratorio'] = row[i];
                } else if (normalizedHeader.includes('coleta') && normalizedHeader.includes('dna')) {
                    obj['coleta_dna_hpv'] = row[i];
                } else if (normalizedHeader.includes('resultado') && normalizedHeader.includes('dna')) {
                    obj['resultado_dna_hpv'] = row[i];
                } else if (normalizedHeader.includes('variavel') && normalizedHeader.includes('2')) {
                    obj['data_coleta_v2'] = row[i];
                } else if (normalizedHeader.includes('situacao')) {
                    obj['status'] = row[i];
                }
            }
        });
        
        // Gerar ID se não tiver
        if (!obj.id) {
             obj.id = obj['cns'] || `${obj['nome'] || 'paciente'}-${obj['unidade'] || 'unidade'}-${rowIndex + 1}`;
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
    console.error('[Pacientes] Erro capturado:', err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
