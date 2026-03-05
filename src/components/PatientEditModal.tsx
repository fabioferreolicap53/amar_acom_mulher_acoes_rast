import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Patient, Exam } from '../types';

interface PatientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

const PatientEditModal: React.FC<PatientEditModalProps> = ({ isOpen, onClose, patient }) => {
  const [activeTab, setActiveTab] = useState('exams');
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [newExam, setNewExam] = useState({ tipo: '', data: '', obs: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen && patient?.id) {
        loadRecentExams();
    }
  }, [isOpen, patient]);

  const loadRecentExams = async () => {
    setLoadingExams(true);
    try {
        if (!patient?.id) return;
        const result = await api.exames.listByPatient(patient.id);
        setRecentExams(result.items as unknown as Exam[]);
    } catch (e) {
        console.error('Erro ao carregar exames:', e);
    } finally {
        setLoadingExams(false);
    }
  };

  const handleSaveExam = async () => {
      if (!newExam.tipo || !newExam.data) return;
      
      try {
          const user = api.auth.getUser();
          await api.exames.create({
              patient_id: patient.id,
              tipo_exame: newExam.tipo,
              data_realizacao: newExam.data,
              observacao: newExam.obs,
              usuario_id: user?.id
          });
          setNewExam({ tipo: '', data: '', obs: '' });
          setIsAdding(false);
          loadRecentExams();
      } catch (e) {
          console.error('Erro ao salvar exame:', e);
          alert('Erro ao salvar exame.');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-white shadow-sm">
              {(patient?.nome || patient?.name || '?').charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{patient?.nome || patient?.name || 'Paciente'}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">badge</span>
                  ID: {patient?.id}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">group</span>
                  Eq: {patient?.equipe}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100 flex gap-6">
          {['exams', 'personal'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'personal' && 'Dados Pessoais (Sheets)'}
              {tab === 'exams' && 'Acompanhamento de Exames'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {activeTab === 'exams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Histórico e Registros</h3>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">{isAdding ? 'remove' : 'add'}</span>
                  {isAdding ? 'Cancelar' : 'Registrar Novo Exame'}
                </button>
              </div>

              {isAdding && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4 animate-in slide-in-from-top-2">
                      <h4 className="font-bold text-blue-900 mb-3 text-sm">Novo Registro</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-blue-800 mb-1">Tipo de Exame</label>
                              <input 
                                  type="text" 
                                  className="w-full p-2 rounded-lg border-blue-200 text-sm focus:ring-blue-500" 
                                  placeholder="Ex: Mamografia"
                                  value={newExam.tipo}
                                  onChange={e => setNewExam({...newExam, tipo: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-blue-800 mb-1">Data Realização</label>
                              <input 
                                  type="date" 
                                  className="w-full p-2 rounded-lg border-blue-200 text-sm focus:ring-blue-500"
                                  value={newExam.data}
                                  onChange={e => setNewExam({...newExam, data: e.target.value})}
                              />
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-blue-800 mb-1">Observação</label>
                              <textarea 
                                  className="w-full p-2 rounded-lg border-blue-200 text-sm focus:ring-blue-500" 
                                  rows={2}
                                  value={newExam.obs}
                                  onChange={e => setNewExam({...newExam, obs: e.target.value})}
                              ></textarea>
                          </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                          <button 
                            onClick={handleSaveExam}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                          >
                              Salvar Registro
                          </button>
                      </div>
                  </div>
              )}

              {/* Lista de Exames Recentes (PocketBase) */}
              {loadingExams ? (
                  <div className="text-center py-4 text-gray-400">Carregando histórico...</div>
              ) : (
                  recentExams.map((exam) => (
                    <div key={exam.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="flex justify-between items-start pl-2">
                            <div>
                                <h4 className="font-bold text-gray-900">{exam.tipo_exame}</h4>
                                <p className="text-sm text-gray-500">Realizado em: {new Date(exam.data_realizacao).toLocaleDateString('pt-BR')}</p>
                                {exam.observacao && (
                                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg">{exam.observacao}</p>
                                )}
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                Via Sistema
                            </span>
                        </div>
                    </div>
                  ))
              )}

              {/* Dados da Planilha (Read-Only) */}
              {patient?.exame_a && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 opacity-75">
                      <div className="flex justify-between items-start">
                          <div>
                              <h4 className="font-bold text-gray-700">Registro Planilha (Exame A)</h4>
                              <p className="text-sm text-gray-500">Data: {patient.exame_a}</p>
                          </div>
                          <span className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-full">
                                Importado
                            </span>
                      </div>
                  </div>
              )}
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-900">{patient?.nome || patient?.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-900">{patient?.unidade}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipe</label>
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-900">{patient?.equipe}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Micro Área</label>
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-900">{patient?.micro_area}</div>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400 text-center">Dados sincronizados do Google Sheets. Somente leitura.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientEditModal;
