import React, { useState, useEffect } from 'react';
import PatientEditModal from '../components/PatientEditModal';
import { api } from '../services/api';
import type { Patient } from '../types';

const Patients = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
        const result = await api.patients.list();
        // Verifica se o resultado tem a estrutura { data, headers } ou é um array direto
        if (Array.isArray(result)) {
            setPatients(result);
        } else {
            setPatients(result.data);
            setHeaders(result.headers || []);
        }
    } catch (err) {
        console.error(err);
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
    loadPatients();
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UNIDADE
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EQUIPE
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MICROÁREA
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NOME
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNS
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DATA DE NASCIMENTO (IDADE)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VARIÁVEL 2 (DATA DA COLETA)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RESULTADO SISCAN (DATA DO RESULTADO)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RESULTADO LABORATÓRIO (DATA DO CADASTRO)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  APROVADOS LABORATÓRIO(DATA DA COLETA)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  COLETA DNA HPV
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RESULTADO DNA HPV
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.unidade || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.equipe || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.micro_area || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {(patient.nome || patient.name || '?').charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient.nome || patient.name || '-'}</div>
                        <div className="text-xs text-gray-500">ID: #{patient.id || '-'}</div>
                        {patient.telefone && <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">call</span>{patient.telefone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.cns || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient['dat-nascimento'] || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.data_coleta_v2 || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.resultado_siscan || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.resultado_laboratorio || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.aprovados_laboratorio || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.coleta_dna_hpv || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.resultado_dna_hpv || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(patient)}
                      className="text-blue-600 hover:text-blue-900 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Acompanhar
                    </button>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                    <td colSpan={13} className="px-6 py-10 text-center text-gray-500">
                        Nenhum paciente encontrado com este termo de busca.
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
