import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
    onClose(); // Fecha a sidebar ao deslogar
  };

  const menuItems = [
    { icon: 'dashboard', label: 'Painel', path: '/' },
    { icon: 'group', label: 'Pacientes', path: '/pacientes' },
    { icon: 'clinical_notes', label: 'Acompanhamentos', path: '/acompanhamentos' },
    { icon: 'bar_chart', label: 'Relatórios', path: '/relatorios' },
    { icon: 'settings', label: 'Configurações', path: '/configuracoes' },
  ];

  return (
    <>
      {/* Overlay para fechar a sidebar ao clicar fora */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside className={clsx(
        "w-64 bg-[#1c2e4a] text-white flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-300",
        "md:hidden", // Esconde em desktop
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header da Sidebar (Logo) */}
        <div className="flex items-center h-16 px-6 bg-[#16243a]">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="material-symbols-outlined text-white text-xl">shield</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">AMAR</h1>
            </div>
        </div>

        {/* Conteúdo da Sidebar */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose} // Fecha a sidebar ao clicar em um item
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
          
          <button 
            onClick={handleLogout}
            className="w-full mt-4 flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
