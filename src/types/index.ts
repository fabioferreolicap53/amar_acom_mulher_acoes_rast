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
