import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/' },
    { icon: 'group', label: 'Pacientes', path: '/pacientes' },
    { icon: 'calendar_today', label: 'Agenda', path: '/agenda' },
    { icon: 'bar_chart', label: 'Relatórios', path: '/relatorios' },
    { icon: 'settings', label: 'Configurações', path: '/configuracoes' },
  ];

  return (
    <aside className="w-64 bg-[#1c2e4a] text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-xl">health_and_safety</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">AMAR</h1>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group',
              isActive(item.path)
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <span className={clsx("material-symbols-outlined transition-colors", isActive(item.path) ? "text-white" : "text-gray-400 group-hover:text-white")}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
            {item.label === 'Pacientes' && (
              <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                12
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-400 text-sm">sync</span>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status do Sistema</p>
              <p className="text-sm font-medium text-green-400">Online</p>
            </div>
          </div>
          <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full w-full animate-pulse"></div>
          </div>
        </div>
        
        <button className="w-full mt-4 flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm">
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
