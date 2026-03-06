import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import clsx from 'clsx';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
      // Pequeno delay para garantir que o authStore foi carregado se estiver vindo de refresh
      const loadUser = () => {
          const u = api.auth.getUser();
          if (u) {
              setUser(u);
          }
      };
      loadUser();
      // Assinar mudanças no authStore seria ideal, mas por simplicidade vamos carregar uma vez
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: 'dashboard', label: 'Painel', path: '/' },
    { icon: 'group', label: 'Pacientes', path: '/pacientes' },
    { icon: 'clinical_notes', label: 'Acompanhamentos', path: '/acompanhamentos' },
    { icon: 'bar_chart', label: 'Relatórios', path: '/relatorios' },
    { icon: 'settings', label: 'Configurações', path: '/configuracoes' },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 h-16 bg-[#1c2e4a] flex items-center justify-between shadow-md md:fixed md:z-50">
      {/* Logo e Nome */}
      <div className="flex items-center h-full px-4 bg-[#16243a]">
        {/* Botão de Hambúrguer (Mobile/Tablet) */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300 hover:text-white -ml-2 mr-2 z-50" // Ajuste de margem
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="material-symbols-outlined text-white text-xl">shield</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden md:hidden">AMAR</h1>
        </div>
      </div>

      {/* Contexto da Unidade (Estilo Imagem) */}
      {user && (
        <div className="hidden lg:flex items-center h-full mr-auto">
            {/* Unidade */}
            <div className="flex flex-col items-center justify-center px-6 border-l border-white/5 h-full bg-[#1c2e4a] hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-blue-400 text-xl">apartment</span>
                <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Unidade</span>
                <span className="text-sm font-bold text-white tracking-tight text-center" title={user.unidade}>{user.unidade || 'N/A'}</span>
            </div>
            
            {/* Equipe */}
            <div className="flex flex-col items-center justify-center px-6 border-l border-white/5 h-full bg-[#1c2e4a] hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-blue-400 text-xl">groups</span>
                <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Equipe</span>
                <span className="text-sm font-bold text-white tracking-tight uppercase text-center">{user.equipe || 'N/A'}</span>
            </div>
            
            {/* Microárea */}
            <div className="flex flex-col items-center justify-center px-6 border-l border-r border-white/5 h-full bg-[#1c2e4a] hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-blue-400 text-xl">location_on</span>
                <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Microárea</span>
                <span className="text-sm font-bold text-white tracking-tight uppercase text-center">{user.micro_area || 'N/A'}</span>
            </div>
        </div>
      )}

      {/* Navegação Central (Ícones com Títulos) */}
      <nav className="hidden md:flex items-center gap-1 flex-1 px-4 justify-center">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              'flex flex-col items-center justify-center px-3 py-1 rounded-md transition-all duration-200',
              isActive(item.path)
                ? 'text-blue-400 bg-blue-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Ações do Usuário e Busca */}
      <div className="flex items-center h-full bg-[#16243a] px-6 gap-4">
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#1c2e4a] animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors group">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            <span className="material-symbols-outlined text-white text-lg">question_mark</span>
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-bold text-white leading-none">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-300">Profissional de Saúde</p>
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
