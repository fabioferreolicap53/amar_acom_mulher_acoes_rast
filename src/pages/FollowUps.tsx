import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { FollowUp, Patient } from '../types';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

interface ExpandedFollowUp extends FollowUp {
  expand?: {
    patient_id?: Patient;
  };
}

const FollowUps = () => {
  const [followUps, setFollowUps] = useState<ExpandedFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    data_inicio: '',
    data_fim: '',
    tipo: '',
    desfecho: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
        const activeFilters: any = {};
        if (filters.data_inicio) activeFilters.data_inicio = filters.data_inicio;
        if (filters.data_fim) activeFilters.data_fim = filters.data_fim;
        if (filters.tipo) activeFilters.tipo = filters.tipo;
        if (filters.desfecho) activeFilters.desfecho = filters.desfecho;

        // @ts-ignore - listAll ainda não tipado no index.ts talvez, mas existe no api.ts
        const result = await api.followUps.list(1, 50, activeFilters);
        setFollowUps(result.items as unknown as ExpandedFollowUp[]);
    } catch (error) {
        console.error('Erro ao carregar acompanhamentos:', error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };
  
  const clearFilters = () => {
      setFilters({
        data_inicio: '',
        data_fim: '',
        tipo: '',
        desfecho: ''
      });
      setTimeout(() => {
          // Recarregar com filtros vazios
          // Como o estado não atualiza imediatamente, chamar loadData aqui pegaria estado antigo se usasse filters do state.
          // Mas loadData usa filters do state. Então preciso passar filtros explícitos ou esperar.
          // Melhor: recarregar manualmente passando vazio.
          api.followUps.list(1, 50, {}).then(result => {
              setFollowUps(result.items as unknown as ExpandedFollowUp[]);
          });
      }, 50); 
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acompanhamentos</h1>
          <p className="text-gray-500 text-sm mt-1">Histórico de ações realizadas com os pacientes</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
                <input 
                    type="date" 
                    name="data_inicio"
                    value={filters.data_inicio}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
                <input 
                    type="date" 
                    name="data_fim"
                    value={filters.data_fim}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                    name="tipo"
                    value={filters.tipo}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">Todos</option>
                    <option value="visita">Visita</option>
                    <option value="telefonema">Telefonema</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="busca_ativa">Busca Ativa</option>
                    <option value="outro">Outro</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Desfecho</label>
                <select 
                    name="desfecho"
                    value={filters.desfecho}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">Todos</option>
                    <option value="sucesso">Sucesso</option>
                    <option value="insucesso">Insucesso</option>
                    <option value="recusa">Recusa</option>
                    <option value="mudou_se">Mudou-se</option>
                    <option value="obito">Óbito</option>
                </select>
            </div>
            <div className="flex gap-2">
                <button 
                    type="submit"
                    className="flex-1 bg-blue-600 text-white p-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    Filtrar
                </button>
                <button 
                    type="button"
                    onClick={clearFilters}
                    className="bg-gray-100 text-gray-600 p-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    title="Limpar filtros"
                >
                    <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                </button>
            </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        ) : followUps.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
                Nenhum acompanhamento encontrado com os filtros selecionados.
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-calibri">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-calibri">Paciente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-calibri">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-calibri">Desfecho</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-calibri">Observação</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-calibri">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {followUps.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-calibri">
                                    {new Date(item.data_contato).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900 font-calibri">
                                            {item.expand?.patient_id?.nome || item.expand?.patient_id?.name || 'Paciente não encontrado'}
                                        </span>
                                        <span className="text-xs text-gray-500 font-calibri">
                                            {item.expand?.patient_id?.unidade || '-'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize font-calibri">
                                    {item.tipo.replace('_', ' ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={clsx(
                                        "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize font-calibri",
                                        item.desfecho === 'sucesso' ? "bg-green-100 text-green-800" :
                                        item.desfecho === 'insucesso' ? "bg-red-100 text-red-800" :
                                        "bg-blue-100 text-blue-800"
                                    )}>
                                        {item.desfecho.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate font-calibri" title={item.observacao}>
                                    {item.observacao || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link 
                                        to={`/pacientes/${item.patient_id}/acompanhamento`}
                                        className="text-blue-600 hover:text-blue-900 flex justify-end"
                                        title="Ver Detalhes"
                                    >
                                        <span className="material-symbols-outlined">visibility</span>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default FollowUps;
