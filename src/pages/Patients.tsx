import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientEditModal from '../components/PatientEditModal';
import { api } from '../services/api';
import type { Patient } from '../types';

const Patients = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkUserAndLoad = async () => {
        // Tenta obter usuário do cache primeiro
        let currentUser = api.auth.getUser();
        console.log('Usuário inicial do cache:', currentUser);
        
        // Se não tiver no cache, tenta forçar um refresh se tiver token
        if (!currentUser && localStorage.getItem('pocketbase_auth')) {
            try {
                console.log('Token encontrado no localStorage, tentando recuperar sessão...');
                // Pequeno delay para garantir que o PocketBase inicializou
                await new Promise(resolve => setTimeout(resolve, 500));
                currentUser = api.auth.getUser();
                console.log('Usuário após recuperação:', currentUser);
            } catch (e) {
                console.warn('Falha ao recuperar sessão:', e);
            }
        }

        if (currentUser) {
            setCurrentUser(currentUser);
            // Se o usuário existe mas não tem unidade vinculada (ex: admin geral ou cadastro incompleto)
            // Tenta carregar mesmo assim, talvez a API trate isso (retornando tudo ou nada)
            // Mas para evitar o erro visual, vamos logar o aviso e tentar.
            if (!currentUser.unidade) {
                console.warn('Usuário logado sem unidade vinculada:', currentUser);
            }
            console.log('Carregando pacientes com unidade:', currentUser.unidade, 'equipe:', currentUser.equipe, 'micro_area:', currentUser.micro_area);
            loadPatients(currentUser.unidade, currentUser.equipe, currentUser.micro_area);
        } else {
            // Se realmente não tiver usuário, redireciona ou mostra erro
            // Em vez de só mostrar erro, vamos tentar carregar sem filtros (se a API permitir)
            // ou redirecionar para login se for crítico.
            console.error('Usuário não encontrado no contexto. Redirecionando...');
            // navigate('/login'); // Opcional: forçar login
            setError('Sessão expirada. Por favor, faça login novamente.');
            setLoading(false);
        }
    };

    checkUserAndLoad();
  }, []);

  const loadPatients = async (unidade?: string, equipe?: string, microArea?: string) => {
    setLoading(true);
    try {
        const filters: any = {};
        if (unidade) filters.unidade = unidade;
        if (equipe) filters.equipe = equipe;
        if (microArea) filters.microArea = microArea;
        console.log('Chamando api.patients.list com filtros:', filters);
        const result = await api.patients.list(filters);
        console.log('Resultado da API:', result);
        // Verifica se o resultado tem a estrutura { data, headers } ou é um array direto
        if (Array.isArray(result)) {
            setPatients(result);
            if (result.length > 0) console.log('Exemplo de paciente:', result[0]);
        } else {
            setPatients(result.data);
            if (result.data.length > 0) console.log('Exemplo de paciente:', result.data[0]);
            setHeaders(result.headers || []);
        }
    } catch (err) {
        console.error('Erro na carga de pacientes:', err);
        setError('Erro ao carregar lista de pacientes.');
    } finally {
        setLoading(false);
    }
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
    // Recarrega para ver atualizações
    const currentUser = api.auth.getUser();
    if (currentUser) {
        loadPatients(currentUser.unidade, currentUser.equipe, currentUser.micro_area);
    }
  };

  const filteredPatients = patients.filter(p => 
    (p.nome || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.id || '').toString().includes(searchTerm)
  );

  // Função auxiliar para encontrar o header correto
  const getHeader = (keys: string[]) => {
      if (!headers.length) return null;
      // Procura um header que contenha alguma das chaves
      return headers.find(h => keys.some(k => h.toLowerCase().includes(k.toLowerCase())));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de Pacientes</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os pacientes da sua unidade</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <input 
                    type="text" 
                    placeholder="Buscar paciente por nome ou ID..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">search</span>
             </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500">error</span>
            {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-7xl mx-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider font-calibri min-w-[250px]">
                  NOME
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider font-calibri min-w-[120px]">
                  NPRONT / NºSUS
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider font-calibri min-w-[100px]">
                  NASCIMENTO
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider font-calibri min-w-[100px]">
                  DATA COLETA
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider font-calibri min-w-[150px]">
                  RES. SISCAN
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider font-calibri min-w-[150px]">
                  RES. LABORATÓRIO
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider font-calibri min-w-[150px]">
                  APROVADOS LAB.
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider font-calibri min-w-[120px]">
                  COLETA DNA
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider font-calibri min-w-[120px]">
                  RES. DNA
                </th>
                <th scope="col" className="relative px-4 py-3 text-center font-calibri min-w-[100px]">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-3 whitespace-normal text-left">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs font-calibri">
                          {(patient.nome || patient.name || '?').charAt(0)}
                        </div>
                      </div>
                      <div className="ml-3 text-left">
                        <div className="text-sm font-medium text-gray-900 font-calibri leading-tight">{patient.nome || patient.name || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900 font-calibri">{patient.cns || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900 font-calibri">{patient['dat-nascimento'] || patient.data_nascimento || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900 font-calibri">{patient.data_coleta_v2 || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-normal text-center">
                    <div className="text-xs text-gray-900 font-calibri leading-tight">{patient.resultado_siscan || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-normal text-center">
                    <div className="text-xs text-gray-900 font-calibri leading-tight">{patient.resultado_laboratorio || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-normal text-center">
                    <div className="text-xs text-gray-900 font-calibri leading-tight">{patient.aprovados_laboratorio || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-normal text-center">
                    <div className="text-xs text-gray-900 font-calibri leading-tight">{patient.coleta_dna_hpv || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-normal text-center">
                    <div className="text-xs text-gray-900 font-calibri leading-tight">{patient.resultado_dna_hpv || '-'}</div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(patient)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                          title="Exames"
                        >
                          <span className="material-symbols-outlined text-[20px]">science</span>
                        </button>
                        <button 
                          onClick={() => {
                              navigate(`/pacientes/${patient.id}/acompanhamento`, { state: { patient } });
                          }}
                          className="text-green-600 hover:text-green-900 hover:bg-green-50 p-1.5 rounded-lg transition-colors"
                          title="Acompanhamento"
                        >
                          <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
                        </button>
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                        {patients.length === 0 
                            ? "Nenhum paciente encontrado na base de dados. Verifique se sua unidade/equipe possui registros."
                            : "Nenhum paciente encontrado com este termo de busca."}
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <PatientEditModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        patient={selectedPatient} 
      />
    </div>
  );
};

export default Patients;
