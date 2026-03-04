import React from 'react';

const Placeholder = ({ title }: { title: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-gray-400">construction</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500 max-w-md">
        Esta página está em desenvolvimento. Em breve você terá acesso a todas as funcionalidades deste módulo.
      </p>
    </div>
  );
};

export default Placeholder;
