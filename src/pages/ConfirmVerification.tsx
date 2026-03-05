import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, translateError } from '../services/api';

const ConfirmVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Token de verificação não encontrado.');
      return;
    }

    const confirm = async () => {
      try {
        await api.auth.confirmVerification(token);
        setStatus('success');
        // Redirecionar após 3 segundos
        setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
        console.error('Erro na confirmação:', err);
        setStatus('error');
        
        // Tentar extrair mensagem mais específica se possível
        const msg = translateError(err);
        if (msg.includes('inválido') || msg.includes('expirou')) {
             setErrorMessage('Este link de verificação é inválido ou já foi utilizado. Tente fazer login.');
        } else {
             setErrorMessage(msg || 'Ocorreu um erro ao verificar seu e-mail.');
        }
      }
    };

    confirm();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900">Verificando seu e-mail...</h2>
            <p className="text-gray-500 mt-2">Aguarde um momento.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">E-mail Verificado!</h2>
            <p className="text-gray-500 mt-2">Sua conta foi ativada com sucesso.</p>
            <p className="text-sm text-blue-600 mt-4 font-medium">Redirecionando para o login...</p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir para Login agora
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-in shake duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Ops! Algo deu errado</h2>
            <p className="text-red-600 mt-2 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
              {errorMessage}
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-6 w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Voltar para o Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ConfirmVerification;
