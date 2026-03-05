import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import clsx from 'clsx';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: 'dashboard', label: 'Painel', path: '/' },
    { icon: 'group', label: 'Pacientes', path: '/pacientes' },
    { icon: 'bar_chart', label: 'Relatórios', path: '/relatorios' },
    { icon: 'settings', label: 'Configurações', path: '/configuracoes' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#1c2e4a] border-b border-white/10 flex items-center justify-between px-6 z-50 shadow-md">
      {/* Logo e Nome */}
      <div className="flex items-center gap-3 w-64 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="material-symbols-outlined text-white text-xl">health_and_safety</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">AMAR</h1>
      </div>

      {/* Navegação Horizontal (Desktop) */}
      <nav className="hidden md:flex items-center gap-1 flex-1 px-4 overflow-x-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap',
              isActive(item.path)
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            )}
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            <span>{item.label}</span>
            {item.label === 'Pacientes' && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                12
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Ações do Usuário e Busca */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="relative hidden lg:block w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-200 placeholder-gray-500"
          />
        </div>

        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#1c2e4a] animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors group">
          <div className="w-8 h-8 rounded-full border border-white/10 bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            F
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-medium text-white leading-none">Dr. Fábio</p>
            <p className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-300">Cardiologista</p>
          </div>
          <button onClick={handleLogout} title="Sair">
             <span className="material-symbols-outlined text-gray-400 text-sm group-hover:text-white transition-colors">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
