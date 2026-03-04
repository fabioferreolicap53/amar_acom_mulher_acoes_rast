import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const stats = [
    { title: 'Total Pacientes', value: '1,284', change: '+12%', icon: 'group', color: 'blue' },
    { title: 'Exames Realizados', value: '843', change: '+5%', icon: 'check_circle', color: 'green' },
    { title: 'Pendentes', value: '42', change: '-2%', icon: 'pending', color: 'yellow' },
    { title: 'Resultados Críticos', value: '15', change: '+3', icon: 'warning', color: 'red' },
  ];

  const data = [
    { name: 'Unidade Central', value: 400 },
    { name: 'Zona Norte', value: 300 },
    { name: 'Zona Sul', value: 200 },
    { name: 'Zona Leste', value: 278 },
    { name: 'Zona Oeste', value: 189 },
  ];

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Gerencial</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral do sistema de saúde</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            Últimos 30 dias
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar Relatório
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${stat.change.startsWith('+') ? 'green' : 'red'}-50 text-${stat.change.startsWith('+') ? 'green' : 'red'}-600`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Status de Exames por Unidade</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Últimas Atividades</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline">Ver tudo</button>
          </div>
          <div className="space-y-6">
            {[
              { text: 'Novo exame cadastrado', time: 'Há 2 min', icon: 'lab_profile', color: 'blue' },
              { text: 'Resultado liberado', time: 'Há 15 min', icon: 'check_circle', color: 'green' },
              { text: 'Alerta de resultado crítico', time: 'Há 1 hora', icon: 'warning', color: 'red' },
              { text: 'Paciente admitido', time: 'Há 2 horas', icon: 'person_add', color: 'purple' },
              { text: 'Sincronização concluída', time: 'Há 3 horas', icon: 'sync', color: 'gray' },
            ].map((activity, index) => (
              <div key={index} className="flex gap-4">
                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-${activity.color}-50 text-${activity.color}-600 shrink-0`}>
                  <span className="material-symbols-outlined text-sm">{activity.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
