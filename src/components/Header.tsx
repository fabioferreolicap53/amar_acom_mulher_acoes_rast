import React from 'react';

const Header = () => {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 shadow-sm">
      <div className="flex items-center gap-4 w-full max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            placeholder="Pesquisar pacientes, exames ou médicos..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-600">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
        </button>
        
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-600">
          <span className="material-symbols-outlined">settings</span>
        </button>

        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors pr-3">
          <img
            src="https://lh3.googleusercontent.com/a/ACg8ocIu1v1x1x1x1x1x1x1x1x1x1x1x1x1x1x1x1x1x1x1x1x1=s96-c"
            alt="User Avatar"
            className="w-8 h-8 rounded-full border border-gray-200 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900 leading-none">Dr. Fábio Oliveira</p>
            <p className="text-xs text-gray-500 mt-1">Cardiologista Chefe</p>
          </div>
          <span className="material-symbols-outlined text-gray-400 text-sm">expand_more</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
