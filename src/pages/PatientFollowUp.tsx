import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { Patient, FollowUp } from '../types';
import clsx from 'clsx';

const PatientFollowUp = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [patient, setPatient] = useState<Patient | null>(location.state?.patient || null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    data_contato: new Date().toISOString().split('T')[0],
    tipo: 'visita',
    desfecho: 'sucesso',
    observacao: '',
    proximo_passo: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Carregar paciente se não veio pelo state
        if (!patient) {
            // Tentar buscar na lista (fallback)
            const list = await api.patients.list();
            const found = (Array.isArray(list) ? list : list.data).find(p => p.id === id);
            if (found) setPatient(found);
        }

        // Carregar acompanhamentos
        const result = await api.followUps.listByPatient(id);
        setFollowUps(result.items as unknown as FollowUp[]);
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !patient) return;

    try {
      setSaving(true);
      const user = api.auth.getUser();
      
      const data = {
        patient_id: id,
        ...formData,
        usuario_id: user?.id
      };

      await api.followUps.create(data);
      
      // Recarregar lista
      const result = await api.followUps.listByPatient(id);
      setFollowUps(result.items as unknown as FollowUp[]);
      
      setShowForm(false);
      setFormData({
        data_contato: new Date().toISOString().split('T')[0],
        tipo: 'visita',
        desfecho: 'sucesso',
        observacao: '',
        proximo_passo: ''
      });
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar acompanhamento');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !patient) {
    return (
      <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient && !loading) {
    return (
        <div className="p-8 text-center">
            <div className="text-red-500 mb-2">
                <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Paciente não encontrado</h2>
            <button 
                onClick={() => navigate('/pacientes')}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
                Voltar para lista
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/pacientes')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          title="Voltar"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acompanhamento</h1>
          <p className="text-gray-500">{patient?.nome || patient?.name}</p>
        </div>
      </div>

      {/* Card Paciente */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unidade</span>
            <p className="font-medium">{patient?.unidade || '-'}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Equipe</span>
            <p className="font-medium">{patient?.equipe || '-'}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Microárea</span>
            <p className="font-medium">{patient?.micro_area || '-'}</p>
          </div>
        </div>
      </div>

      {/* Botão Novo Acompanhamento */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Registro
        </button>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-fade-in-down">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Novo Registro</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.data_contato}
                  onChange={e => setFormData({...formData, data_contato: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.tipo}
                  onChange={e => setFormData({...formData, tipo: e.target.value})}
                >
                  <option value="visita">Visita Domiciliar</option>
                  <option value="telefonema">Telefonema</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="busca_ativa">Busca Ativa</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desfecho</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.desfecho}
                onChange={e => setFormData({...formData, desfecho: e.target.value})}
              >
                <option value="sucesso">Sucesso (Contato realizado)</option>
                <option value="insucesso">Insucesso (Não encontrado)</option>
                <option value="recusa">Recusa</option>
                <option value="mudou_se">Mudou-se</option>
                <option value="obito">Óbito</option>
                <option value="agendado">Agendado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.observacao}
                onChange={e => setFormData({...formData, observacao: e.target.value})}
                placeholder="Descreva os detalhes do acompanhamento..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                {saving ? 'Salvando...' : 'Salvar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400">history</span>
            Histórico
        </h3>
        {followUps.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
            Nenhum registro encontrado.
          </div>
        ) : (
          <div className="relative space-y-0 pl-4 border-l-2 border-gray-200 ml-3">
            {followUps.map((item) => (
              <div key={item.id} className="relative pb-8 pl-6 group">
                {/* Dot */}
                <div className={clsx(
                  "absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-2 ring-white",
                  item.desfecho === 'sucesso' ? "bg-green-500" :
                  item.desfecho === 'insucesso' ? "bg-red-500" :
                  "bg-blue-500"
                )}></div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {new Date(item.data_contato).toLocaleDateString('pt-BR')}
                      </span>
                      <h4 className="font-bold text-gray-900 capitalize mt-1 flex items-center gap-2">
                        {item.tipo.replace('_', ' ')}
                      </h4>
                    </div>
                    <span className={clsx(
                      "px-2 py-1 rounded-full text-xs font-bold capitalize border",
                      item.desfecho === 'sucesso' ? "bg-green-50 text-green-700 border-green-200" :
                      item.desfecho === 'insucesso' ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-blue-50 text-blue-700 border-blue-200"
                    )}>
                      {item.desfecho.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {item.observacao && (
                    <p className="text-gray-600 text-sm mt-2 whitespace-pre-line bg-gray-50 p-3 rounded-md">
                      {item.observacao}
                    </p>
                  )}
                  
                  {item.usuario_id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">person</span>
                      Registrado pelo usuário
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientFollowUp;
