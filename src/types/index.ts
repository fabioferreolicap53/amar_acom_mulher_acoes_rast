export interface Patient {
    id: string;
    nome: string;
    name?: string; // Algumas vezes vem como name do Google Sheets
    unidade: string;
    equipe: string;
    micro_area: string;
    exame_a?: string;
    status: 'ok' | 'pendente' | string;
    telefone?: string;
    data_nascimento?: string;
    cns?: string;
    data_coleta_v2?: string;
    resultado_siscan?: string;
    resultado_laboratorio?: string;
    aprovados_laboratorio?: string;
    coleta_dna_hpv?: string;
    resultado_dna_hpv?: string;
    'dat-nascimento'?: string; // Para compatibilidade com o nome da coluna
    situacao?: string; // Para compatibilidade com o nome da coluna
}

export interface DashboardStats {
    totalPacientes: number;
    examesRealizados: number;
    pendentes: number;
    resultadosCriticos: number;
}

export interface Exam {
    id: string;
    patient_id: string;
    tipo_exame: string;
    data_realizacao: string;
    observacao?: string;
    usuario_id?: string;
    created?: string;
    updated?: string;
}

export interface FollowUp {
    id: string;
    patient_id: string;
    data_contato: string;
    tipo: 'visita' | 'telefonema' | 'whatsapp' | 'email' | 'busca_ativa' | 'outro';
    desfecho: 'sucesso' | 'insucesso' | 'recusa' | 'mudou_se' | 'obito' | 'agendado' | 'realizado';
    observacao?: string;
    proximo_passo?: string;
    usuario_id?: string;
    created?: string;
    updated?: string;
}
