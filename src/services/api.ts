import PocketBase from 'pocketbase';
import type { Patient } from '../types';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'https://centraldedados.dev.br');

export interface UnidadeData {
  unidade: string;
  equipe: string;
  microArea: string;
}

// Coleções
export const COLLECTIONS = {
  USERS: 'amar_acom_mulher_acoes_rast_usuarios',
  EXAMES: 'amar_acom_mulher_acoes_rast_registros_exames'
};

/**
 * Traduz mensagens de erro comuns do PocketBase/API para Português
 */
export const translateError = (error: any): string => {
  const message = error?.message || String(error);
  
  if (message.includes('Only admins can perform this action')) {
    return 'Apenas administradores podem realizar esta ação.';
  }
  if (message.includes('Failed to authenticate')) {
    return 'Falha na autenticação. Verifique suas credenciais.';
  }
  if (message.includes('validation_failed')) {
    return 'Dados inválidos. Por favor, verifique os campos preenchidos.';
  }
  if (message.includes('Something went wrong')) {
    return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
  }
  
  return message;
};

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      return await pb.collection(COLLECTIONS.USERS).authWithPassword(email, password);
    },
    logout: () => {
      pb.authStore.clear();
    },
    requestPasswordReset: async (email: string) => {
      await pb.collection(COLLECTIONS.USERS).requestPasswordReset(email);
    },
    register: async (data: { email: string; password: string; passwordConfirm: string; name?: string; unidade?: string; equipe?: string; micro_area?: string }) => {
      const record = await pb.collection(COLLECTIONS.USERS).create({
        ...data,
        emailVisibility: true,
      });
      
      // Forçar envio de e-mail de verificação
      try {
          await pb.collection(COLLECTIONS.USERS).requestVerification(data.email);
      } catch (e) {
          console.warn('Erro ao solicitar verificação de e-mail:', e);
          // Não falhar o cadastro se apenas o envio de e-mail falhar (pode ser problema de SMTP)
      }
      
      return record;
    },
    requestVerification: async (email: string) => {
      return await pb.collection(COLLECTIONS.USERS).requestVerification(email);
    },
    confirmVerification: async (token: string) => {
      return await pb.collection(COLLECTIONS.USERS).confirmVerification(token);
    },
    getUser: () => pb.authStore.model
  },
  unidades: {
    list: async (): Promise<UnidadeData[]> => {
      try {
        // Tentar buscar da API Functions (Cloudflare)
        // Se falhar (HTML/404), tenta o JSON estático na pasta public
        let response;
        try {
            // Tentar API Functions primeiro
            response = await fetch(`/api/unidades?t=${Date.now()}`);
            const contentType = response.headers.get("content-type");
            
            // Se retornou HTML, é erro de rota (Vite servindo index.html)
            if (contentType && contentType.includes("text/html")) {
                throw new Error('Rota da API retornou HTML (Function não encontrada)');
            }
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
        } catch (apiError) {
            console.warn('API Function indisponível, tentando fallback estático...', apiError);
            // Fallback para arquivo estático em public/api/unidades.json
            // Remover timestamp para aproveitar cache do CDN/Navegador se necessário, ou manter se quiser fresh
            response = await fetch('/api/unidades.json');
        }

        if (!response.ok) {
            throw new Error(`Falha ao carregar unidades (Status: ${response.status})`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
             throw new Error('Formato inválido (não é array)');
        }

        return data;
      } catch (e) {
        console.error('Erro crítico ao carregar unidades:', e);
        // Último recurso: dados hardcoded
        return [
            { unidade: "CF DEOLINDO COUTO", equipe: "Equipe 1", microArea: "01" },
            { unidade: "CF EDSON ABDALLA SAAD", equipe: "PRACA DO MAIA", microArea: "01" }
        ];
      }
    }
  },
  patients: {
    list: async (filters?: { unidade?: string; equipe?: string; microArea?: string }): Promise<{ data: Patient[], headers: string[] }> => {
      try {
          const token = pb.authStore.token;
          const queryParams = new URLSearchParams();
          if (filters?.unidade) queryParams.append('unidade', filters.unidade);
          if (filters?.equipe) queryParams.append('equipe', filters.equipe);
          if (filters?.microArea) queryParams.append('microArea', filters.microArea);

          const url = `/api/pacientes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

          const response = await fetch(url, {
            headers: {
                'Authorization': token
            }
          });
          if (!response.ok) throw new Error('Falha ao carregar pacientes');
          return await response.json();
      } catch (e) {
          console.error('Erro na API:', e);
          // Fallback mockado para desenvolvimento (V2)
          return {
              data: [
                { id: '123', nome: 'Maria Silva', unidade: 'UBS Central', equipe: '110', micro_area: '01', data_nascimento: '1980-05-12', telefone: '(11) 99999-1111', exame_a: '2024-01-01', status: 'pendente' },
                { id: '124', nome: 'Joana Souza', unidade: 'UBS Norte', equipe: '110', micro_area: '02', data_nascimento: '1992-08-23', telefone: '(11) 99999-2222', exame_a: '2024-02-01', status: 'ok' },
                { id: '125', nome: 'Ana Costa', unidade: 'UBS Sul', equipe: '111', micro_area: '01', data_nascimento: '1975-11-30', telefone: '(11) 99999-3333', exame_a: '2024-03-01', status: 'pendente' },
                { id: '126', nome: 'Clara Mendes', unidade: 'UBS Leste', equipe: '112', micro_area: '03', data_nascimento: '1985-04-15', telefone: '(11) 99999-4444', exame_a: '2024-04-15', status: 'pendente' },
                { id: '127', nome: 'Beatriz Oliveira', unidade: 'UBS Central', equipe: '110', micro_area: '01', data_nascimento: '1990-05-20', telefone: '(11) 99999-5555', exame_a: '2024-05-20', status: 'ok' }
              ] as Patient[],
              headers: ['Nome Completo', 'Unidade de Saúde', 'Equipe', 'Micro Área', 'Data de Nascimento', 'Telefone', 'Data Coleta', 'Situação']
          };
      }
    }
  },
  dashboard: {
      getStats: async () => {
          // Mock data centralizado
          return {
              stats: [
                { title: 'Total Pacientes', value: '1,284', change: '+12%', icon: 'group', color: 'blue' },
                { title: 'Exames Realizados', value: '843', change: '+5%', icon: 'check_circle', color: 'green' },
                { title: 'Pendentes', value: '42', change: '-2%', icon: 'pending', color: 'yellow' },
                { title: 'Resultados Críticos', value: '15', change: '+3', icon: 'warning', color: 'red' },
              ],
              chartData: [
                { name: 'Unidade Central', value: 400 },
                { name: 'Zona Norte', value: 300 },
                { name: 'Zona Sul', value: 200 },
                { name: 'Zona Leste', value: 278 },
                { name: 'Zona Oeste', value: 189 },
              ]
          };
      }
  },
  exames: {
    create: async (data: any) => {
        return await pb.collection(COLLECTIONS.EXAMES).create(data);
    },
    listByPatient: async (patientId: string) => {
        return await pb.collection(COLLECTIONS.EXAMES).getList(1, 50, {
            filter: `patient_id="${patientId}"`,
            sort: '-created'
        });
    }
  }
};
