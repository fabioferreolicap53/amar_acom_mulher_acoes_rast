import React, { useState } from 'react';

interface PatientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

const PatientEditModal: React.FC<PatientEditModalProps> = ({ isOpen, onClose, patient }) => {
  const [activeTab, setActiveTab] = useState('exams');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-white shadow-sm">
              {patient?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{patient?.name || 'Paciente'}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">badge</span>
                  CPF: {patient?.cpf || '000.000.000-00'}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">cake</span>
                  {patient?.age || '00'} anos
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
          {['personal', 'exams', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'personal' && 'Dados Pessoais'}
              {tab === 'exams' && 'Exames & Resultados'}
              {tab === 'history' && 'Histórico Clínico'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {activeTab === 'exams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Exames Recentes</h3>
                <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Adicionar Novo
                </button>
              </div>

              {/* Exam Card 1 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                      <span className="material-symbols-outlined">favorite</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Hemograma Completo</h4>
                      <p className="text-sm text-gray-500">Solicitado em 12/05/2024 por Dr. Silva</p>
                      
                      <div className="mt-3 flex gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pendente
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Laboratório Central
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
              </div>

              {/* Exam Card 2 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <span className="material-symbols-outlined">science</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Colesterol Total e Frações</h4>
                      <p className="text-sm text-gray-500">Realizado em 10/05/2024</p>
                      
                      <div className="mt-3 flex gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Concluído
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100">
                          <span className="material-symbols-outlined text-xs mr-1">download</span>
                          Ver Resultado
                        </span>
                      </div>

                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">LDL</span>
                          <span className="font-medium text-gray-900">130 mg/dL</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">warning</span>
                          Levemente alterado
                        </p>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input type="text" defaultValue={patient?.name} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <input type="date" defaultValue="1985-10-20" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input type="text" defaultValue={patient?.cpf} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="tel" defaultValue="(11) 99999-9999" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-12 text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">history_edu</span>
              <p>Histórico clínico completo disponível em breve.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientEditModal;
