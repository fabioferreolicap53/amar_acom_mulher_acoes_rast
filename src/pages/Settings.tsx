import React, { useState } from 'react';

const Settings = () => {
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie as preferências do sistema e sincronização</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sincronização */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined text-2xl">sync</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sincronização de Dados</h2>
                <p className="text-sm text-gray-500">Gerencie a integração com laboratórios externos</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${autoSync ? 'text-green-500' : 'text-gray-400'}`}>
                    {autoSync ? 'check_circle' : 'pause_circle'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Sincronização Automática</p>
                    <p className="text-xs text-gray-500">Atualiza resultados a cada 15 minutos</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={autoSync}
                    onChange={() => setAutoSync(!autoSync)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Status da Última Sincronização</span>
                  <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">Sucesso</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Data: 12/05/2024</span>
                  <span>Hora: 14:30:45</span>
                </div>
                <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="material-symbols-outlined text-lg">history</span>
                  Ver Logs
                </button>
                <button className="ml-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-lg">sync_now</span>
                  Sincronizar Agora
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <span className="material-symbols-outlined text-2xl">notifications</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Notificações e Alertas</h2>
                <p className="text-sm text-gray-500">Configure como você deseja ser notificado</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Notificações no Sistema</p>
                  <p className="text-xs text-gray-500">Receba alertas pop-up enquanto usa o sistema</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notifications}
                    onChange={() => setNotifications(!notifications)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              <div className="border-t border-gray-100 my-2"></div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Alertas por Email</p>
                  <p className="text-xs text-gray-500">Receba resumo diário e alertas críticos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={emailAlerts}
                    onChange={() => setEmailAlerts(!emailAlerts)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Perfil e Segurança */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Segurança</h3>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-500">lock</span>
                  <span className="text-sm font-medium text-gray-700">Alterar Senha</span>
                </div>
                <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-500">security</span>
                  <span className="text-sm font-medium text-gray-700">Autenticação em 2 Fatores</span>
                </div>
                <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Precisa de Ajuda?</h3>
              <p className="text-blue-100 text-sm mb-4">Entre em contato com o suporte técnico para resolver problemas de integração.</p>
              <button className="w-full py-2 bg-white text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
                Contatar Suporte
              </button>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-white opacity-10 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
